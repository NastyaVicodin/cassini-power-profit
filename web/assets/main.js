"use strict";

let $map = $('#map');
let $clue = $('#clue');
let portrait = screen.orientation.type.indexOf('portrait') ? false : true;
let panels;
let panelIndex = 0;
fetch('./assets/products.json').then((response) => response.json()).then(function(json) {
	panels = json.panels;
	if (typeof(Storage) !== 'undefined') {
		if(!window.localStorage.getItem('panel')) {
			window.localStorage.setItem('panel', 0);
		}
		else {
			panelIndex = window.localStorage.getItem('panel');
		}
	}
	let html = '';
	for(let i = 0; i < panels.length; i++) {
		let panel = panels[i];
		html += '<div onclick="Products.change(' + i + ')"><img src="assets/product/' + panel.image + '" alt="' + panel.brand + ' ' + panel.name + '" /><h3>' + panel.brand + ' ' + panel.model + '</h3><p>Price per m²: <b>€' + panel.price + '</b><br />Efficiency: <b>' + panel.efficiency * 100 + '%</b></p></div>';
	}
	Products.window.html(html);
});

let CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});
let map = L.map('map', {
    zoomControl: false,
    layers: [CartoDB_Positron]
}).setView([49.843, 9.902056], portrait ? 3 : 5);

const marker_radius = 10;
const cluster_radius = 12;
const marker_pin = marker_radius / 2;
const marker_pin_side = Math.sqrt(Math.pow(marker_radius + marker_pin, 2) - Math.pow(marker_radius, 2));
const marker_pin_hp = (2*marker_radius + marker_pin + marker_pin_side)/2;
const marker_pin_hw = 2*Math.sqrt(marker_pin_hp*(marker_pin_hp - marker_radius)*(marker_pin_hp - marker_radius - marker_pin)*(marker_pin_hp - marker_pin_side))/(marker_radius + marker_pin);
const marker_pin_height = Math.sqrt(Math.pow(marker_pin_side, 2) - Math.pow(marker_pin_hw, 2));
const color = '#39429c';
const colorBg = '#fff';
const ns = 'http://www.w3.org/2000/svg';
const graph_height = 200;
const graph_coef = 50;

let Results = {
	data: [],
	items: [],
	power: [],
	element: [],
	markers: [],
	timeout: null,
	search: function(query) {
		let xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				let response = JSON.parse(xmlhttp.responseText);
				for(let i = 0; i < response.length; i++) {
					Results.add(response[i]);
				}
				if(portrait) {
					result.slideDown();
				}
			}
		}
		xmlhttp.open('GET', 'https://nominatim.openstreetmap.org/search.php?q=' + encodeURI(query) + '&accept-language=en&format=jsonv2&limit=50&dedupe=0', false);
		xmlhttp.send();
	},
	add: function(data) {
		this.data.push(data);
		let item = document.createElement('li');
		item.dataset.lat = data.lat;
		item.dataset.lon = data.lon;
		item.innerHTML = data.display_name;
		result.append(item);
		this.items.push(item);
		var icon = L.divIcon({
			className: 'marker',
			html: '<svg viewBox="0 0 ' + (marker_radius*2 + 2) + ' ' + (marker_radius*2 + marker_pin + marker_radius/2 + 2) + '" width="' + (marker_radius*2 + 2) + '" height="' + (marker_radius*2 + marker_pin + marker_radius/2 + 2) + '"><ellipse fill="rgba(0,0,0,0.2)" cx="' + (marker_radius + 1) + '" cy="' + (marker_radius*2 + marker_pin + 2) + '" rx="' + marker_radius/2 + '" ry="' + marker_radius/4 + '" /><path fill="' + colorBg +'" d="M ' + (marker_radius + 1) + ' ' + (marker_radius*2 + marker_pin + 2) + ' L ' + (marker_radius - marker_pin_hw + 1) + ' ' + (marker_radius*2 + marker_pin - marker_pin_height + 2) + ' L ' + (marker_radius + marker_pin_hw + 1) + ' ' + (marker_radius*2 + marker_pin - marker_pin_height + 2) + ' L ' + (marker_radius + 1) + ' ' + (marker_radius*2 + marker_pin + 2) + ' Z M ' + (marker_radius - marker_pin_hw + 1) + ',' + (marker_radius*2 + marker_pin - marker_pin_height + 2) + ' A ' + (marker_radius + 1) + ',' + (marker_radius + 1) + ' 0 0 0 ' + (marker_radius + marker_pin_height + 1) + ',' + (marker_radius*2 + marker_pin - marker_pin_height + 1) + ' Z" fill-rule="evenodd"/><circle cx="' + (marker_radius + 1) + '" cy="' + (marker_radius + 1) + '" r="' + (marker_radius/3 * 2) + '" stroke="' + colorBg + '" stroke-width="' + (marker_radius/3 * 2 + 2) + '" fill="none" /><circle cx="' + (marker_radius + 1) + '" cy="' + (marker_radius + 1) + '" r="' + (marker_radius/3 * 2) + '" stroke="' + color + '" stroke-width="' + (marker_radius/3 * 2) + '" fill="none" /></svg>',
			iconSize: [marker_radius*2 + 2, marker_radius*2 + marker_pin + marker_radius/4 + 2],
			iconAnchor: [marker_radius + 2, marker_radius*2 + marker_pin - marker_radius/4 + 2],
			popupAnchor: [-1, - marker_radius - marker_pin + marker_radius/4 + 2]
		});
		let marker = L.marker([data.lat, data.lon], {icon: icon}).bindPopup('', {'className': 'result'});
		this.markers.push(marker);
		let lastIndex = this.markers.length - 1;
		marker.on('mousedown', function(event) {
			Results.open(lastIndex);
		});
		marker.getPopup().on('remove', function() {
			window.location.hash = '';
		});
		let lastMarker = this.markers[lastIndex];
		this.markerCluster.addLayer(lastMarker);
		if(search.data('load') == 'open') {
			map.flyTo(lastMarker.getLatLng());
			setTimeout(function() {
				Results.deactivate();
				Results.open(0);
				lastMarker.fire('click');
				search.data('load', '');
			}, 100);
		}
	},
	clear: function() {
		this.markerCluster.clearLayers();
		this.data = [];
		this.items = [];
		this.power = [];
		this.markers = [];
		result.html('');
	},
	markerCluster: L.markerClusterGroup({
		maxClusterRadius: 40,
		removeOutsideVisibleBounds: false,
		polygonOptions: {
			fillColor: color,
			color: color,
			weight: 0.5,
			opacity: 1,
			fillOpacity: 0.5
		},
		iconCreateFunction: function (cluster) {
			let markers = cluster.getAllChildMarkers();
			let select = false;
			for(let i = 0; i < markers.length; i++) {
				if(markers[i].options.icon.options.className.indexOf('highlight') !== -1) {
					select = true;
				}
			}
			return L.divIcon({
				className: 'marker' + (select ? ' highlight' : ''),
				html: '<svg viewBox="0 0 ' + (cluster_radius*2 + 4) + ' ' + (cluster_radius*2 + 4) + '" width="' + (cluster_radius*2 + 4) + '" height="' + (cluster_radius*2 + 4) + '" class="cluster"><circle cx="' + (cluster_radius + 2) + '" cy="' + (cluster_radius + 2) + '" r="' + (cluster_radius + 1) + '" fill="' + colorBg + '" /><circle cx="' + (cluster_radius + 2) + '" cy="' + (cluster_radius + 2) + '" r="' + (cluster_radius) + '" fill="' + color + '" /><text x="' + (cluster_radius + 2) + '" y="' + (cluster_radius + 7) + '">' + markers.length + '</text></svg>',
				iconSize: [cluster_radius*2 + 4, cluster_radius*2 + 4],
				iconAnchor: [cluster_radius + 2, cluster_radius + 2],
				popupAnchor: [0, -cluster_radius]
			});
		}
	}),
	select: function(index) {
		if(this.markers[index]._icon) {
			$(this.markers[index]._icon).addClass('highlight');
		}
		else {
			this.markers[index].options.icon.options.className += ' highlight';
			this.markerCluster.refreshClusters(this.markers[index]);
		}
	},
	unselect: function(index) {
		if(this.markers[index]._icon) {
			$(this.markers[index]._icon).removeClass('highlight');
		}
		else {
			this.markers[index].options.icon.options.className = this.markers[index].options.icon.options.className.replace(' highlight', '');
			this.markerCluster.refreshClusters(this.markers[index]);
		}
	},
	click: function(index) {
		let marker = this.markers[index];
		map.closePopup();
		map.stop();
		if(marker._icon) {
			let latlng = marker.getLatLng();
			if(map.getBounds().contains(latlng)) {
				window.location.hash = latlng.lat+'_'+latlng.lng;
				Results.open(index);
				marker.fire('click');
			}
			else {
				map.flyTo(latlng);
				map.once('moveend', function() {
					window.location.hash = latlng.lat+'_'+latlng.lng;
					Results.open(index);
					marker.fire('click');
                });
			}
		}
		else {
			let cluster = this.markerCluster.getVisibleParent(marker);
			if(cluster && cluster._icon) {
				map.flyTo(cluster._latlng);
				map.once('moveend', function() {
					if(cluster._icon) {
						cluster._icon.click();
					}
					setTimeout(function() {
						$(Results.items[index]).click();
					}, 100);
                });
				if(!portrait) {
					this.markerCluster.refreshClusters();
				}
			}
		}
	},
	activate: function() {
		$clue.show();
		$map.addClass('active');
	},
	deactivate: function() {
		$clue.hide();
		$map.removeClass('active');
	},
	open: function(index) {
		if(!this.power[index]) {
			Results.popup(index);
			Products.window.data('marker', index);
			window.location.hash = this.data[index].lat+'_'+this.data[index].lon;
			/*let svg = document.getElementById('svg');
			while(svg.lastChild) {
				svg.removeChild(svg.lastChild);
			}*/
		}
	},
	popup: function(index) {
		let panel = panels[panelIndex];
		this.power[index] = power_profit(this.data[index].lat, this.data[index].lon, panel.efficiency);
		let svg = document.createElementNS(ns, 'svg');
		svg.setAttributeNS(null, 'viewBox', '0 0 366 ' + graph_height);
		svg.setAttributeNS(null, 'width', '366px');
		svg.setAttributeNS(null, 'height', graph_height + 'px');
		let i = 0;
		let year_sum = 0;
		let min = 4;
		for(let month = 1; month <= 12; month++) {
			let month_sum = 0;
			for(let day = 1; day <= days_in_month[month - 1]; day++) {
				let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				let height = this.power[index].daily_energy[i]*graph_coef;
				let x = i;
				let y = graph_height - height;
				circle.setAttribute('cx', x);
				circle.setAttribute('cy', y);
				circle.setAttribute('r', 1);
				svg.appendChild(circle);
				month_sum += this.power[index].daily_energy[i];
				if(min > this.power[index].daily_energy[i]) {
					min = this.power[index].daily_energy[i];
				}
				i++;
			}
			let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			let height = month_sum * graph_coef / days_in_month[month - 1];
			let x = i - days_in_month[month - 1];
			let y = graph_height - height;
			rect.setAttribute('x', 0);
			rect.setAttribute('y', 0);
			rect.setAttribute('width', days_in_month[month - 1]);
			rect.setAttribute('height', height);
			rect.setAttribute('class', 'sum');
			group.appendChild(rect);
			if(height > 20) {
				let record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				record.setAttribute('x', days_in_month[month - 1] / 2);
				record.setAttribute('y', height - 5);
				let text = document.createTextNode(Math.round(month_sum / days_in_month[month - 1] * 10) / 10);
				record.appendChild(text);
				group.appendChild(record);
			}
			group.setAttribute('transform', 'translate(' + x + ',' + y + ')');
			svg.appendChild(group);
			year_sum += month_sum;
		}
		let record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		record.setAttribute('x', 10);
		record.setAttribute('y', 20);
		let text = document.createTextNode('Avg: ');
		record.appendChild(text);
		let span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		text = document.createTextNode(Math.round(year_sum / 366 * 10) / 10);
		span.appendChild(text);
		record.appendChild(span);
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		span.setAttribute('class', 'small');
		text = document.createTextNode(' kWh/day');
		span.appendChild(text);
		record.appendChild(span);
		svg.appendChild(record);
		record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		record.setAttribute('x', 10);
		record.setAttribute('y', 40);
		text = document.createTextNode('Min: ');
		record.appendChild(text);
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		text = document.createTextNode(Math.round(min * 10) / 10);
		span.appendChild(text);
		record.appendChild(span);
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		span.setAttribute('class', 'small');
		text = document.createTextNode(' kWh/day');
		span.appendChild(text);
		record.appendChild(span);
		svg.appendChild(record);
		record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		record.setAttribute('x', 10);
		record.setAttribute('y', 58);
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		span.setAttribute('class', 'small');
		text = document.createTextNode('per 1 m² of panel');
		span.appendChild(text);
		record.appendChild(span);
		svg.appendChild(record);
		record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		record.setAttribute('x', 321);
		record.setAttribute('y', 20);
		record.setAttribute('class', 'right');
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		text = document.createTextNode(Math.ceil(10 / min));
		span.appendChild(text);
		record.appendChild(span);
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		span.setAttribute('class', 'small');
		text = document.createTextNode(' m²');
		span.appendChild(text);
		record.appendChild(span);
		svg.appendChild(record);
		record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		record.setAttribute('x', 321);
		record.setAttribute('y', 40);
		record.setAttribute('class', 'right');
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		text = document.createTextNode('€ ');
		span.setAttribute('class', 'small');
		span.appendChild(text);
		record.appendChild(span);
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		text = document.createTextNode(Math.ceil(Math.ceil(10 / min) * panel.price));
		span.appendChild(text);
		record.appendChild(span);
		svg.appendChild(record);
		record = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		record.setAttribute('x', 321);
		record.setAttribute('y', 58);
		record.setAttribute('class', 'right');
		span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
		span.setAttribute('class', 'small');
		text = document.createTextNode('avg. house');
		span.appendChild(text);
		record.appendChild(span);
		svg.appendChild(record);
		let html = '<div class="months">';
		for(let i = 0; i < 12; i++) {
			html += '<div>' + month_names_short[i] + '</div>';
		}
		html += '</div><div class="panel"><img src="assets/product/' + panel.image + '" alt="' + panel.brand + ' ' + panel.model + '" title="' + panel.brand + ' ' + panel.model + '" onclick="Products.show()" /></div>';
		this.markers[index].setPopupContent(svg.outerHTML + html);
	}
};

Results.markerCluster.on('clusterclick', function (a) {
	let markers = a.layer.getAllChildMarkers();
	for(let i = 0; i < markers.length; i++) {
		setTimeout(function() {
			markers[i].options.icon.options.className = markers[i].options.icon.options.className.replace(' highlight', '');
		}, 100);
	}
});

map.addLayer(Results.markerCluster);

let search = $('#search input');
let result = $('#search ul');
let clear = $('#clear');

search.on('keyup', function(event) {
	let query = this.value;
	clearTimeout(Results.timeout);
	Results.clear();
	if(query) {
		clear.show();
		if(!event.originalEvent) {
			search.data('load', 'open');
			Results.search(query);
		}
		else {
			search.data('load', '');
			if(event.originalEvent.keyCode == 13) {
				Results.search(query);
			}
			else {
				Results.timeout = setTimeout(Results.search, 1000, query);
			}
		}
	}
	else {
		clear.hide();
	}
	Results.activate();
}).on('focus', function() {
	if(portrait) {
		result.slideDown();
	}
	Results.activate();
}).on('blur', function() {
	if(portrait) {
		result.slideUp();
	}
	Results.deactivate();
});

clear.on('click', function() {
	map.closePopup();
	search.val('').keyup();
	search.blur();
});

result.on('mouseenter', 'li', function() {
	if(!portrait) {
		Results.select($(this).index());
	}
}).on('mouseleave', 'li', function() {
	if(!portrait) {
		Results.unselect($(this).index());
	}
}).on('click', 'li', function() {
	Results.click($(this).index());
});

$(window).on('orientationchange resize', function() {
	portrait = screen.orientation.type.indexOf('portrait') ? false : true;
	if(portrait && !search.is(":focus")) {
		result.slideUp();
	}
	else {
		result.slideDown();
	}
});

map.on('mousedown', function(event){
	if(event.originalEvent.target.id === 'map' && $map.hasClass('active')) {
		let coord = event.latlng;
		let lat = coord.lat;
		let lng = coord.lng;
		search.val(lat + ' ' + lng).keyup();
	}
});

if(window.location.hash) {
	search.val(window.location.hash.substr(1).replace('_', ' ')).keyup();
}

let Products = {
	window: $('#products'),
	bg: $('#bg'),
	show: function() {
		this.window.show();
		this.bg.show();
	},
	hide: function() {
		this.window.hide();
		this.bg.hide();
	},
	change: function(index) {
		if(index != panelIndex) {
			if(typeof(Storage) !== 'undefined') {
				window.localStorage.setItem('panel', parseInt(index));
			}
			Results.power.length = 0;
			panelIndex = parseInt(index);
			Results.popup(Products.window.data('marker'));
		}
		this.hide();
		console.log(index, panelIndex);
	}
}

Products.bg.on('click', function() {
	Products.hide();
});