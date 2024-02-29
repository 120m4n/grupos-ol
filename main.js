// @ts-nocheck
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileJSON from 'ol/source/TileJSON.js';
import View from 'ol/View.js';
import {Group as LayerGroup} from 'ol/layer.js';
import {fromLonLat} from 'ol/proj.js';
import TileLayer from 'ol/layer/Tile.js';
import TileWMS from 'ol/source/TileWMS.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import MVT from 'ol/format/MVT.js';

var parentWindow = window.parent;

class Message {
    constructor(type, body) {
        this.type = type;
        this.body = body;
    }
}

function sendMessage(windowObj, payload) {
    if (windowObj) {
        windowObj.postMessage(payload, "*");
    }
}


const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new LayerGroup({
      layers: [
        new TileLayer({
          name: 'layer1',
          // extent: [-13884991, 2870341, -7455066, 6338219],
          source: new TileWMS({
            url: 'https://geoserver-vector.amdc-gobgeo.com/geoserver/wms',
            params: {'LAYERS': 'amdc:LINDERO_PREDIO_SECTOR_11', 'TILED': true},
            serverType: 'geoserver',
            // Countries have transparency, so do not fade tiles:
            transition: 0,
          }),
        }),
        new TileLayer({
          name: 'layer2',
          // extent: [-13884991, 2870341, -7455066, 6338219],
          source: new TileWMS({
            url: 'https://geoserver-vector.amdc-gobgeo.com/geoserver/wms',
            params: {'LAYERS': 'amdc:LINDERO_PREDIO_SECTOR_12', 'TILED': true},
            serverType: 'geoserver',
            // Countries have transparency, so do not fade tiles:
            transition: 0,
          }),
        }),
        new TileLayer({
          name: 'layer3',
          // extent: [-13884991, 2870341, -7455066, 6338219],
          source: new TileWMS({
            url: 'https://geoserver-vector.amdc-gobgeo.com/geoserver/wms',
            params: {'LAYERS': 'amdc:LINDERO_PREDIO_SECTOR_13', 'TILED': true},
            serverType: 'geoserver',
            // Countries have transparency, so do not fade tiles:
            transition: 0,
          }),
        }),
        // new VectorTileLayer({
        //   name: 'layer5',
        //   declutter: true,
        //   source: new VectorTileSource({
        //     maxZoom: 15,
        //     format: new MVT({
        //       idProperty: 'iso_a3',
        //     }),
        //     url:
        //       'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/' +
        //       'ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
        //   }),
        // }),
        new VectorTileLayer({
          name: 'layer4',
          declutter: true,
          source: new VectorTileSource({
            crossOrigin: "Anonymous",
            maxZoom: 15,
            format: new MVT({
              idProperty: 'iso_a3',
            }),
            url:
              'https://geoserver-vector.amdc-gobgeo.com/geoserver/gwc/service/tms/1.0.0/' +
              'amdc:ALDEAS_DISTRITO_CENTRAL@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
          }),
        }),
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-87.2251, 14.071]),
    zoom: 13,
  }),
});

map.on('singleclick', function (event) {
  
  if (event.dragging) {
    return;
  }

  let vtLayer;
  let selection = {};

  map.getLayers().forEach(function (layer, i) {
    // check if layer is a group
    if (layer instanceof LayerGroup) {
      layer.getLayers().forEach(function (sublayer, j) {
        // set vtLayer if name is 'layer4'
        if (sublayer.get('name') === 'layer4') {
          vtLayer = sublayer;
        }
      });
    }
  });

  // Now you can use vtLayer in your code 
  if (!vtLayer) {
    return;
  }

  vtLayer.getFeatures(event.pixel).then(function (features) {
    if (!features.length) {
      // selection = {};
      return;
    }
    const feature = features[0];
    if (!feature) {
      return;
    }
    // const fid = feature.getId();

    // selection = {};

    // add selected feature to lookup
    // selection[fid] = feature;
    console.log('selection', features[0].getProperties());

    // return message to parent
  });
});

function bindInputs(layerid, layer) {
  const visibilityInput = $(layerid + ' input.visible');
  visibilityInput.on('change', function () {
    layer.setVisible(this.checked);
  });
  visibilityInput.prop('checked', layer.getVisible());

  const opacityInput = $(layerid + ' input.opacity');
  opacityInput.on('input', function () {
    layer.setOpacity(parseFloat(this.value));
    // return message to parent
    sendMessage(parentWindow, new Message("updateSliderValue", {name: layer.get('name'), opacity: this.value}));
  });
  opacityInput.val(String(layer.getOpacity()));
}
function setup(id, group) {
  group.getLayers().forEach(function (layer, i) {
    const layerid = id + i;
    bindInputs(layerid, layer);
    if (layer instanceof LayerGroup) {
      setup(layerid, layer);
    }
  });
}
setup('#layer', map.getLayerGroup());

$('#layertree li > span')
  .click(function () {
    $(this).siblings('fieldset').toggle();
  })
  .siblings('fieldset')
  .hide();




  /* SHAKE HAND WITH PARENT */
  window.addEventListener("load", () => {
    setTimeout(function () {
        sendMessage(parentWindow, new Message("shakehand", true));
    }, 2000);
  });


window.addEventListener('message', (event) => {
  const data = event.data;
  let opacity = data.opacity;

  // Ensure opacity is a number
  opacity = Number(opacity);

  // Check if opacity is not within [0,1] range
  if (opacity < 0) {
    opacity = 0;
  } else if (opacity > 1) {
    opacity = 1;
  }
  if (data.type === 'changeOpacity') {
    map.getLayers().forEach(function (layer, i) {
      // check if layer is a group
      if (layer instanceof LayerGroup) {
        layer.getLayers().forEach(function (sublayer, j) {
          // set opacity of sublayer if name matches the name in the message
          // console.log(sublayer.get('name') + data.name);
          if (sublayer.get('name') === data.name){
            sublayer.setOpacity(opacity);
          }
        });
      }
      
    });
  }
});