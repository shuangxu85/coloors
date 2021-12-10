//Global selections and variables
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");
let initialColors;
//This is for local storage
let savedPalettes = [];

//Add our event listeners
generateBtn.addEventListener("click", randomColors);
lockButton.forEach((button, index) => {
	button.addEventListener("click", (e) => {
		lockLayer(e, index);
	});
});
sliders.forEach((slider) => {
	slider.addEventListener("input", hslControls);
});
colorDivs.forEach((div, index) => {
	div.addEventListener("change", () => {
		updateTextUI(index);
	});
});
currentHexes.forEach((hex) => {
	hex.addEventListener("click", () => {
		copyToClipboard(hex);
		// we can not pass down the hex if we do not use arrow function
	});
});
popup.addEventListener("click", () => {
	// popup 指的是copyToClipboard后弹出的窗口
	// const popupBox = popup.children[0];
	popup.classList.remove("active");
	// popupBox.classList.remove("active");
});
adjustButton.forEach((button, index) => {
	button.addEventListener("click", () => {
		openAdjustmentPanel(index);
	});
});
closeAdjustments.forEach((button, index) => {
	button.addEventListener("click", () => {
		closeAdjustmentPanel(index);
	});
});

//Functions
//Color Generator
function generateRGB() {
	// const letters = "0123456789ABCDE";
	// let hash = "#";
	// for (let i = 0; i < 6; i++) {
	// 	hash += letters[Math.floor(Math.random() * 15)];
	// }
	// return hash;
	const rgbColor = chroma.random();
	return rgbColor;
}
// const randomHex = generateHex();

function randomColors() {
	initialColors = [];
	colorDivs.forEach((div, index) => {
		const hexH2 = div.children[0];
		const randomRgb = generateRGB();
		// ~ randomColor ~ chroma(randomColor.hex()) ~ rgb(11,11,11)
		// ~ #randomColor.hex() ~ #83a338
		//Add it to the array
		if (div.classList.contains("locked")) {
			initialColors.push(hexH2.innerText);
			return;
		} else {
			initialColors.push(randomRgb);
		}
		//Add the color to the bg
		div.style.backgroundColor = randomRgb;
		hexH2.innerText = randomRgb.hex();
		//Check for hex-text contrast
		checkTextContrast(randomRgb, hexH2);
		//Initial Colorize Sliders
		const colorRgb = chroma(randomRgb);
		const slidersInput = div.querySelectorAll(".sliders input");
		const hueInput = slidersInput[0];
		const brightInput = slidersInput[1];
		const satInput = slidersInput[2];
		colorizeSliders(colorRgb, hueInput, brightInput, satInput);
	});
	//Reset Inputs
	resetInputs();

	// Check for adjustment button and lock button contrast
	adjustButton.forEach((button, index) => {
		checkTextContrast(initialColors[index], button);
		checkTextContrast(initialColors[index], lockButton[index]);
	});
}

function checkTextContrast(colorRgb, textH2) {
	const luminance = chroma(colorRgb).luminance();
	if (luminance > 0.5) {
		textH2.style.color = "black";
	} else {
		textH2.style.color = "white";
	}
}

function colorizeSliders(colorRgb, hueInput, brightInput, satInput) {
	//Scale Saturation
	const noSat = colorRgb.set("hsl.s", 0); // Desaturate it as much as possible
	const fullSat = colorRgb.set("hsl.s", 1);
	const scaleSat = chroma.scale([noSat, colorRgb, fullSat]);
	//Scale Brightness
	const midBright = colorRgb.set("hsl.l", 0.5);
	const scaleBright = chroma.scale(["black", midBright, "white"]);

	//Update Input Colors
	satInput.style.backgroundImage = `linear-gradient(to right, ${scaleSat(
		0
	)}, ${scaleSat(1)})`;
	brightInput.style.backgroundImage = `linear-gradient(to right, ${scaleBright(
		0
	)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
	hueInput.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75),rgb(74, 204, 75), rgb(75, 204, 204),rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`;
}

function hslControls(e) {
	const index =
		e.target.getAttribute("data-hue") ||
		e.target.getAttribute("data-sat") ||
		e.target.getAttribute("data-bright");
	// e.target.parentElement 指的是slider的上一级： <div class="sliders">
	let slidersInput = e.target.parentElement.querySelectorAll(
		'input[type="range"]'
	);
	const hueInput = slidersInput[0];
	const brightInput = slidersInput[1];
	const satInput = slidersInput[2];

	// 更新hex text
	const bgColor = initialColors[index];
	let color = chroma(bgColor)
		.set("hsl.h", hueInput.value)
		.set("hsl.l", brightInput.value)
		.set("hsl.s", satInput.value);
	//改变div的颜色
	colorDivs[index].style.backgroundColor = color;

	//Colorize input
	//例如当调节bright slider时，sat slider的颜色也会更新
	colorizeSliders(color, hueInput, brightInput, satInput);
}

function updateTextUI(index) {
	const activeDiv = colorDivs[index];
	const colorRGB = chroma(activeDiv.style.backgroundColor);
	const textHex = activeDiv.querySelector("h2");
	const icon = activeDiv.querySelector(".controls button");
	textHex.innerText = colorRGB.hex();
	//Check contrast
	checkTextContrast(colorRGB, textHex);
	checkTextContrast(colorRGB, icon);
}

function resetInputs() {
	//每次refresh后，slider里的hsl值也update
	const slidersInput = document.querySelectorAll(".sliders input");
	slidersInput.forEach((slider) => {
		if (slider.name == "hue") {
			const hueColor = initialColors[slider.getAttribute("data-hue")];
			//hueColor is the RGB value
			const hueValue = chroma(hueColor).hsl()[0];
			//提前Hex中的hue value
			//hue value for 0, saturation value for 1, brightness for 2
			//hue value is one number
			slider.value = Math.floor(hueValue);
		}
		if (slider.name == "brightness") {
			const brightColor = initialColors[slider.getAttribute("data-bright")];
			const brightValue = chroma(brightColor).hsl()[2];
			slider.value = Math.floor(brightValue * 100) / 100;
		}
		if (slider.name == "saturation") {
			const satColor = initialColors[slider.getAttribute("data-sat")];
			const satValue = chroma(satColor).hsl()[1];
			slider.value = Math.floor(satValue * 100) / 100;
		}
	});
}

function copyToClipboard(hex) {
	const el = document.createElement("textarea");
	// ~ el指的是一个textarea
	el.value = hex.innerText;
	document.body.appendChild(el);
	el.select(); //create a selection
	document.execCommand("copy"); // execute the command of copy
	document.body.removeChild(el);
	//Pop up an animation
	// const popupBox = popup.children[0];
	popup.classList.add("active");
	// popupBox.classList.add("active");
}

function openAdjustmentPanel(index) {
	sliderContainers[index].classList.toggle("active");
}
function closeAdjustmentPanel(index) {
	sliderContainers[index].classList.remove("active");
}
function lockLayer(e, index) {
	const lockSVG = e.target.children[0];
	// ~ lockSVG ~ <i class="fas fa-lock-open"></i>
	const activeBg = colorDivs[index];
	activeBg.classList.toggle("locked");

	//变换图标
	if (lockSVG.classList.contains("fa-lock-open")) {
		e.target.innerHTML = '<i class="fas fa-lock"></i>';
	} else {
		e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
	}
}

//Implement Save to palette and Local Storage Stuff
const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");
const clearStorageBtn = document.querySelector(".clear-localStorage");

//Event Listeners
saveBtn.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);
clearStorageBtn.addEventListener("click", () => {
	localStorage.clear();
	const palettes = document.querySelectorAll(".custom-palette");
	palettes.forEach((palette) => {
		libraryContainer.children[0].removeChild(palette);
	});
});

// Functions
function openPalette(e) {
	saveContainer.classList.add("active");
	// const popup = saveContainer.children[0];
	// popup.classList.add("active");
}
function closePalette(e) {
	saveContainer.classList.remove("active");
}
function savePalette(e) {
	saveContainer.classList.remove("active");
	const name = saveInput.value;
	const colors = [];
	currentHexes.forEach((hex) => {
		colors.push(hex.innerText);
	});
	//Generate Object
	let paletteNr;
	// ~ palette的数量
	const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
	if (paletteObjects) {
		paletteNr = paletteObjects.length;
	} else {
		paletteNr = savedPalettes.length;
	}

	const paletteObj = { name: name, colors, nr: paletteNr };
	// name is saveInput.value
	savedPalettes.push(paletteObj);
	//Save to localStorage
	saveToLocal(paletteObj);
	saveInput.value = "";

	//Generate the palette for library
	const palette = document.createElement("div");
	palette.classList.add("custom-palette");
	const title = document.createElement("h4");
	title.innerText = paletteObj.name;
	const preview = document.createElement("div");
	preview.classList.add("small-preview");
	paletteObj.colors.forEach((smallColor) => {
		const smallDiv = document.createElement("div");
		smallDiv.style.backgroundColor = smallColor;
		preview.appendChild(smallDiv);
	});
	const paletteBtn = document.createElement("button");
	paletteBtn.classList.add("pick-palette-btn");
	paletteBtn.classList.add(paletteObj.nr);
	paletteBtn.innerText = "Select";

	//Attach event to the btn
	paletteBtn.addEventListener("click", (e) => {
		closeLibrary();
		const paletteIndex = e.target.classList[1];
		// [1]指的是paletteBtn.classList.add(paletteObj.nr);
		initialColors = [];
		savedPalettes[paletteIndex].colors.forEach((color, index) => {
			initialColors.push(color);
			colorDivs[index].style.backgroundColor = color;
			const text = colorDivs[index].children[0];
			checkTextContrast(color, text);
			updateTextUI(index);
		});
		resetInputs();
		// update the sliders
	});

	//Append to library
	palette.appendChild(title);
	palette.appendChild(preview);
	palette.appendChild(paletteBtn);
	libraryContainer.children[0].appendChild(palette);
}

function saveToLocal(paletteObj) {
	// const paletteObj = { name: name, colors, nr: paletteNr };
	let localPalettes;
	if (localStorage.getItem("palettes") === null) {
		// ~ getItem() ~ 获取
		localPalettes = [];
	} else {
		localPalettes = JSON.parse(localStorage.getItem("palettes"));
	}
	localPalettes.push(paletteObj);
	localStorage.setItem("palettes", JSON.stringify(localPalettes));
	//~ 应该是不能一个一个存储，而只能打包存储金localStorage，所以需要localPlaettes来过度一下
}

function openLibrary() {
	// const popup = libraryContainer.children[0];
	libraryContainer.classList.add("active");
	// popup.classList.add("active");
}
function closeLibrary() {
	// const popup = libraryContainer.children[0];
	libraryContainer.classList.remove("active");
	// popup.classList.remove("active");
}

function getLocal() {
	if (localStorage.getItem("palettes") === null) {
		localPalettes = [];
	} else {
		const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
		savedPalettes = [...paletteObjects];
		// take a copy of paletteObjects to savedPalettes
		paletteObjects.forEach((paletteObj) => {
			//Generate the palette for library
			const palette = document.createElement("div");
			palette.classList.add("custom-palette");
			const title = document.createElement("h4");
			title.innerText = paletteObj.name;
			const preview = document.createElement("div");
			//记录之前的颜色
			preview.classList.add("small-preview");
			paletteObj.colors.forEach((smallColor) => {
				const smallDiv = document.createElement("div");
				smallDiv.style.backgroundColor = smallColor;
				preview.appendChild(smallDiv);
			});
			const paletteBtn = document.createElement("button");
			paletteBtn.classList.add("pick-palette-btn");
			paletteBtn.classList.add(paletteObj.nr);
			paletteBtn.innerText = "Select";

			//Attach event to the btn
			paletteBtn.addEventListener("click", (e) => {
				closeLibrary();
				const paletteIndex = e.target.classList[1];
				// [1]指的是paletteBtn.classList.add(paletteObj.nr);
				initialColors = [];
				paletteObjects[paletteIndex].colors.forEach((color, index) => {
					// not from savedPalettes, but from paletteObjects
					initialColors.push(color);
					colorDivs[index].style.backgroundColor = color;
					const text = colorDivs[index].children[0];
					checkTextContrast(color, text);
					updateTextUI(index);
				});
				resetInputs();
				// update the sliders
			});

			//Append to library
			palette.appendChild(title);
			palette.appendChild(preview);
			palette.appendChild(paletteBtn);
			libraryContainer.children[0].appendChild(palette);
		});
	}
}

getLocal();
randomColors();
