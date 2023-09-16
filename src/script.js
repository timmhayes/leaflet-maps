
// examples and geojson data from:
// https://geojson-maps.ash.ms/
// https://leafletjs.com/examples/choropleth/ 
import leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css';
import './styles.css'

console.log(leaflet);
(async () => {

  // ~~~~~~~~~~~~~~~~ create map

  const getColor = (d) => d ? 'red' : 'white'

  const style = (feature) => {
    return {
      fillColor: getColor(feature.properties.selected),
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7,
    };
  }

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  const highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    layer.bringToFront();
    info.update(layer.feature.properties);
  }

  const resetHighlight = (e) => {
    geojson.resetStyle(e.target);
    info.update();
  }

  const zoomToFeature = (e) => {
    console.log(e.target)
    map.fitBounds(e.target.getBounds());
  }

  var map = L.map('map').setView([0, -80], 4);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  // ~~~~~~~~~~~~~~~~ download geojson and map data

  const [geoResponse, agreementResponse] = await Promise.all([fetch('custom.geo.json'), fetch('agreements.json')])
  const mapData = await geoResponse.json()
  const agreementData = await agreementResponse.json()

  const geojson = L.geoJson(mapData, {
    clickable: true,
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);


  // ~~~~~~~~~~~~~~~~ control that shows state info on hover

  const info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
  };

  info.update = function (props) {
    if (!props) {
      this._div.innerHTML = 'Hover over a country'
    } else {
      const agreements = agreementData.filter(agreement => agreement.countries.find(country => country.code == props.su_a3))
      const agreementList = agreements.map(agreement => `<li>${agreement.title}`).join(', ')
      this._div.innerHTML = `<h4>${props.formal_en}</h4>
          ${agreementList ? `<ul>${agreementList}</ul>` : ''}
        `
    }
  };

  info.addTo(map);


  // ~~~~~~~~~~~~~~~~ create interactive legend

  var legend = L.control({ position: 'bottomright' });
  console.log(agreementData)
  legend.onAdd = (map) => {

    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<h4>Fake Chat GPT List</h4>' + agreementData.map((agreement) => {
      return `<label><input type="radio" name="map" value="${agreement.abbr}"/>${agreement.abbr}</label><br/>`
    }).join('')

    div.addEventListener('change', (e) => {
      const agreement = agreementData.find(agreement => agreement.abbr == e.target.value)
      const codes = agreement.countries.map(country => country.code)
      geojson.eachLayer(function (layer) {
        console.log(layer.feature.properties.su_a3)
        if (codes.includes(layer.feature.properties.su_a3)) {
          layer.setStyle({ fillColor: 'red', color: 'white' })
          layer.feature.properties.selected = true
        } else {
          layer.setStyle({ fillColor: 'white', color: 'white' })
          layer.feature.properties.selected = false
        }
        info._div.innerHTML = `<h4>${agreement.title}</h4>
            <p>${agreement.description}</p>
          `
      });
      // map.fitBounds(geojson.getBounds());
    })

    return div;
  };

  legend.addTo(map);

})()