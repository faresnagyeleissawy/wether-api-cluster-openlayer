// intial openlayer map
const map = new ol.Map({
  target: "map",
  view: new ol.View({
    center: [30, 30],
    zoom: 3,
  }),
  layers: [],
});
// reqest map from stadiamaps
const grayMap = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png",
    tilePixelRatio: 2,
    maxZoom: 20,
  }),
  visible: false,
  title: "grayMap",
});
// add style to features
var style = new ol.style.Style({
  fill: new ol.style.Fill({
    color: "rgba(255, 255, 255, 0.0)",
  }),
  stroke: new ol.style.Stroke({
    color: "#f21602",
    width: 12,
  }),
  image: new ol.style.Circle({
    radius: 7,
    fill: new ol.style.Fill({
      color: "#ffcc33",
    }),
  }),
});
// upload and read geohason with defualt crs
const geojasonFile = new ol.layer.Vector({
  source: new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: "./map.geojson",
  }),
  style: style,
  title: "geojasonFile",
});
const egyLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: "https://geowebservices.stanford.edu/geoserver/wfs?request=getFeature&outputformat=application/json&typeName=druid:vn895fq9113",
  }),
  title: "egyLayer",
});

// tile layer from openlayer
const lightmap = new ol.layer.Tile({
  source: new ol.source.OSM(),
  visible: true,
  title: "lightMap",
});
// append layer into layers properity array
map.addLayer(lightmap);
// map.addLayer(grayMap);
// map.addLayer(geojasonFile);
// map.addLayer(egyLayer);

// creat group of layer
const basemapGroup = new ol.layer.Group({
  layers: [lightmap, grayMap],
});
// add event listener to radio inputs
// const changers = document.querySelectorAll("input");
// changers.forEach((changer) => {
//   changer.addEventListener("change", function (element) {
//     const layer_name = element.target.id;
//     // read id attribute from html elemnt equal layer name
//     console.log(layer_name);
//     basemapGroup.getLayers().forEach((layer) => {
//       // set true visible for selected layer
//       if (layer_name === layer.get("title")) {
//         layer.setVisible(true);
//         // console.log(layer_name);
//       } else {
//         layer.setVisible(false);
//       }
//     });
//   });
// });
// implemt of overlay
const popup = new ol.Overlay({
  element: document.querySelector("#popup"),
});

map.addOverlay(popup);

const gov = document.querySelector("#gov");
const city = document.querySelector("#city");

map.on("click", (e) => {
  map.forEachFeatureAtPixel(
    e.pixel,
    function (feature) {
      popup.setPosition(e.coordinate);
      console.log(e.coordinate);
      gov.innerHTML = feature.get("name_1");
      city.innerHTML = feature.get("name_2");
    },
    {
      layerFilter: (layer) =>
        ["egyLayer", "geojasonFile"].includes(layer.get("title")),
    }
  );
});

const measurLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
});
// const drowLayer = new ol.layer.Vector({
//   source: new ol.source.Vector(),
// });

let ISdraw = true;
let drawInteraction;
let drawType = "Point";
// map.addLayer(measurLayer);

function createdrawInteraction(featureType) {
  return new ol.interaction.Draw({
    type: featureType,
    source: measurLayer.getSource(),
  });
}
drawOption = document.querySelector(".dropDwon");
drawOption.addEventListener("change", (e) => {
  const selecteDrawType = e.target.value;
  drawType = selecteDrawType;
  if (!ISdraw) {
    map.removeInteraction(drawInteraction);
    drawInteraction = createdrawInteraction(drawType);
    map.addInteraction(drawInteraction);
  }
});
const drowbtn = document.querySelector(".drowbtn");
drowbtn.addEventListener("click", (e) => {
  if (ISdraw) {
    drawInteraction = createdrawInteraction(drawType);
    map.addInteraction(drawInteraction);
    ISdraw = false;
  } else {
    map.removeInteraction(drawInteraction);
    ISdraw = true;
  }
});

// implement class overlay  of measure tool
// class Overlay {
//   constructor(
//     map,
//     offset = [0, -15],
//     positioning = "bottom-center",
//     element = document.querySelector("#popup")
//   ) {
//     (this.map = map),
//       (this.overlay = new ol.Overlay({
//         element: element,
//         offset: offset,
//         positioning: positioning,
//       }));
//     this.overlay.setPosition([0, 0]);
//     this.overlay.element.style.display = "block";
//     this.map.addOverlay(this.overlay);
//   }
// }

//     cluster        //////

let feature;
let ss = fetch("./citiesWeather.json")
  .then((res) => res.json())
  .then((data) => {
    let listFeatures = creatFeatures(data.cities);
    console.log(listFeatures);
    let weatherVectorLayerSource = new ol.source.Vector({
      features: listFeatures,
    });
    const clusterSource = new ol.source.Cluster({
      distance: 70,
      minDistance: 10,
      source: weatherVectorLayerSource,
    });
    let weatherVectorLayer = new ol.layer.Vector({
      source: clusterSource,
      style: (cluster) => {
        let maxtemp = Number.NEGATIVE_INFINITY;
        let features = cluster.get("features");
        features.forEach((feature) => {
          let temprature = feature.get("temprature");
          if (temprature > maxtemp) maxtemp = temprature;
        });
        let feature = features.find(
          (feature) => feature.get("temprature") === maxtemp
        );
        let weather = feature.get("weather");
        let iconUrl;
        switch (weather) {
          case "Clouds":
            iconUrl = "./cloud.png";
            break;
          case "Clear":
            iconUrl = "./pngwing.com.png";
            break;
          default:
            iconUrl = "./rain.png";
            break;
        }
        return new ol.style.Style({
          image: new ol.style.Icon({
            src: iconUrl,
            scale: 0.02,
          }),
        });
      },
    });

    map.addLayer(weatherVectorLayer);
  });

function creatFeatures(listCities) {
  let listFeatures = [];
  listCities.forEach((city) => {
    let lat = city.city.coord.lat;
    let lon = city.city.coord.lon;
    let name = city.city.name;
    let weather = city.weather[0].main;
    let temprature = city.main.temp;
    let feature = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.transform([lon, lat], "EPSG:4326", "EPSG:3857")
      ),
      name,
      weather,
      temprature,
    });
    listFeatures.push(feature);
  });
  return listFeatures;
}
//   //// geocoding///////
const pinLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
});
map.addLayer(pinLayer);
let timer;
let searchbox = document.querySelector("#searchbox");
let searchList = document.querySelector("#placeopetion");
searchbox.addEventListener("input", (e) => {
  let text = e.target.value;
  clearTimeout(timer);
  timer = setTimeout(() => {
    let dataPromise = getGeocondingData(text);
    dataPromise.then((data) => {
      searchList.innerHTML = "";
      data.features.forEach((f) => {
        let name = f.properties.display_name;
        let li = document.createElement("li");
        li.innerHTML = name;
        li.id = f.properties.osm_id;

        li.addEventListener("click", (e) =>
          clickPlaceListHandeler(e, data.features)
        );
        searchList.append(li);
      });
    });
  }, 500);
});
let pinLocation;
function clickPlaceListHandeler(e, features) {
  let id = e.target.id;
  let feature = features.find((feature) => feature.properties.osm_id == id);
  let coords = ol.proj.transform(
    feature.geometry.coordinates,
    "EPSG:4326",
    "EPSG:3857"
  );
  map.getView().animate({ zoom: 5 }, { center: coords });
  pinLayer.getSource().removeFeature(pinLocation);
  pinLocation = new ol.Feature({
    geometry: new ol.geom.Point(coords),
  });
  pinLocation.setStyle(
    new ol.style.Style({
      image: new ol.style.Icon({
        src: "./pin.jfif",
        scale: 0.07,
      }),
    })
  );
  pinLayer.getSource().addFeature(pinLocation);
}

function getGeocondingData(searchInput) {
  return fetch(
    "https://nominatim.openstreetmap.org/search?q=" +
      searchInput +
      "&format=geojson"
  )
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
}
