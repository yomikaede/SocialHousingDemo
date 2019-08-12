function popPicBox(id) {
	var popLayer = document.getElementById(id);
	popLayer.style.display = "block";
}

function closePicBox(id) {
	var popLayer = document.getElementById(id);
	popLayer.style.display = "none";
}

function popChart() {
	var popLayer = document.getElementById("chartPopLayer");
	popLayer.style.display = "block";
}

function closeChart() {
	var popLayer = document.getElementById("chartPopLayer");
	popLayer.style.display = "none";
}