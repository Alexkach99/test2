const ODESSA = [46.5, 30.75];
var coords = [];
var polyline;
var pointEditor;
var container;
var map;
var pointInput;
var pointList;
var pointIds;
var ready = 0;

waitUntil(() => ready === 2)
.then(initUI);

ymaps.ready(init);

function onLoad() {
	container = document.getElementById('map');
	pointEditor = document.getElementsByClassName('pointEditor')[0];
	pointInput = document.getElementById('newPoint');
	pointList = document.getElementById('pointList');
	
	ready++;
}

async function init() {
    // Создаем карту.
    map = new ymaps.Map("map", {
        center: await getLocation(),
        zoom: 10
    });
	
	var controlPanel;;
	waitUntil(() => controlPanel = document.getElementsByClassName('ymaps-2-1-65-controls-pane')[0])
	.then(() => {
		deleteNode(controlPanel);
	});
	
    // Создаем ломаную.
    polyline = new ymaps.Polyline([], {
		balloonContent: 'ggggggg'
	}, {
        // Задаем опции геообъекта.
        // Цвет с прозрачностью.
        strokeColor: "#0000FFCC",
        // Ширину линии.
        strokeWidth: 4,
        // Максимально допустимое количество вершин в ломаной.
        editorMaxPoints: 0,
        // Удаляем контекстное меню.
        editorMenuManager: (items, data) => {
			polyline.balloon.open(data.geometry._coordinates);
			polyline.properties.set('balloonContent', getPointName(data.geometry._coordinates) );
            items.length = 0;
            return items;
        },
		openBalloonOnClick: false
    });
	polyline.events.add('geometrychange', e => {
		const newCoords = polyline.geometry.getCoordinates();
		if (newCoords.length < coords.length) {
			deleteCoord(newCoords);
		} else {
			coords = newCoords;
		}
		polyline.balloon.close();
		savePoints();
	})

    // Добавляем линию на карту.
    map.geoObjects.add(polyline);

    // Включаем режим редактирования.
    polyline.editor.startEditing();
	
	ready++;
}

function initUI() {
	const docWidth = $(document).width();
	const docHeight = $(document).height();
	if (docWidth > docHeight) {
		var width = (docWidth * 0.666 | 0) + 'px';
		var height = docHeight + 'px';
		document.body.classList.remove('vertical');
		document.body.classList.add('horizontal');
		pointEditor.classList.remove('pointEditor-bottom');
		pointEditor.classList.add('pointEditor-right');
	} else {
		var width = docWidth + 'px';
		var height = (docHeight * 0.666 | 0) + 'px';
		document.body.classList.remove('horizontal');
		document.body.classList.add('vertical');
		pointEditor.classList.remove('pointEditor-right');
		pointEditor.classList.add('pointEditor-bottom');
	}
	
	container.style.width = width;
	container.style.height = height;
	
	skipError(() => map.container.fitToViewport());
	
	loadPoints();
}

function getLocation() {
    if (navigator.geolocation) {
        return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(position => {
				resolve([
					position.coords.latitude,
					position.coords.longitude
				]);
			},
			error => {
				resolve(ODESSA);
			});
		});
    } else {
		return ODESSA;
	}
}

function addPoint() {
	if (!pointInput || pointInput.value.length === 0) {
		return;
	}
	
	const point = document.createElement('li');
	const delBtn = document.createElement('button');
	const text = document.createElement('span');
	point.setAttribute('draggable', true);
	point.id = Math.random();
	text.innerText = pointInput.value;
	delBtn.innerText = 'X';
	delBtn.classList.add('del-btn');
	delBtn.onclick = () => deletePoint(point);
	pointList.appendChild(point);
	point.appendChild(text);
	point.appendChild(delBtn);
	
	coords.push( map.getCenter() );
	polyline.options.set('editorMaxPoints', coords.length);
	polyline.geometry.setCoordinates(coords);
	updatePointIds();
	
	savePoints();
}

function getPointName(coord) {
	const index = coords.findIndex( coordEqual(coord) );
	
	return pointList.children[index].firstChild.innerText;
}

function deletePoint(point) {
	const index = new Array(...pointList.children).indexOf(point);
	if (index === -1) {
		return;
	}
	
	coords.splice(index, 1);
	polyline.geometry.setCoordinates(coords);
	deleteNode(point);
	polyline.options.set('editorMaxPoints', coords.length);
	updatePointIds();
	
	savePoints();
}

function deleteCoord(newCoords) {
	const index = coords.findIndex(coord => !newCoords.find( coordEqual(coord) ));
	if (index === -1) {
		return;
	}
	
	coords.splice(index, 1);
	deleteNode( pointList.children[index] );
	polyline.options.set('editorMaxPoints', coords.length);
	updatePointIds();
}

function coordEqual(c1) {
	return c2 => c1[0] === c2[0] && c1[1] === c2[1];
}

function deleteNode(node) {
	node.parentNode.removeChild(node);
}

function dropComplete() {
	const newIds = getPointIds();
	
	for (var i = newIds.length; i--;) {
		const j = pointIds.indexOf(newIds[i]);
		if (j !== i) {
			pointIds.swap(i, j);
			coords.swap(i, j);
			break;
		}
	}
	
	polyline.geometry.setCoordinates(coords);
	polyline.options.set('editorMaxPoints', coords.length);
	
	addBtnListeners();
	
	savePoints();
}

function addBtnListeners() {
	for (const point of pointList.children) {
		point.lastChild.onclick = () => deletePoint(point);
	}
}

function savePoints() {
	localStorage.setItem('coords', JSON.stringify(coords));
	localStorage.setItem('pointIds', JSON.stringify(pointIds));
	localStorage.setItem('pointList', pointList.innerHTML);
}

function loadPoints() {
	if (!(localStorage.getItem('coords') && localStorage.getItem('pointIds') && localStorage.getItem('pointList'))) {
		return;
	}
	
	coords = JSON.parse( localStorage.getItem('coords') );
	pointIds = JSON.parse( localStorage.getItem('pointIds') );
	pointList.innerHTML = localStorage.getItem('pointList');
	
	addBtnListeners();
	
	polyline.geometry.setCoordinates(coords);
}

function updatePointIds() {
	pointIds = getPointIds();
}

function getPointIds() {
	return new Array(...pointList.children).map(point => point.id);
}

//Из-за бага в API Яндекс карт приходиться
//перезагружать страницу при изменении размеров окна
function onResize(repeat) {
	location.reload();
}

function skipError(func) {console.log(0);
	try {
		func();
	} catch(e) {
		skipError(func);
	}
}

function wait(time) {
	return new Promise( (resolve, reject) => {
		setTimeout(resolve, time);
	});
}

function waitUntil(condition) {
	return new Promise( (resolve, reject) => {
		if ( condition() ) {
			resolve();
		} else {
			resolve( wait(500).then(res => waitUntil(condition) ) );
		}
	});
}

Array.prototype.swap = function(i, j) {
	const t = this[i];
	this[i] = this[j];
	this[j] = t;
}