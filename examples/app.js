var bounds = map.getBounds(),
    southWest = bounds.getSouthWest(),
    northEast = bounds.getNorthEast(),
    smallBounds = L.latLngBounds (
        L.latLng(
            [(southWest.lat + (northEast.lat - southWest.lat) / 4),
             (southWest.lng + (northEast.lng - southWest.lng) / 4)]
        ),
        L.latLng(
           [(northEast.lat - (northEast.lat - southWest.lat) / 4),
            (northEast.lng - (northEast.lng - southWest.lng) / 4)]
        )),
    rect2 = L.rectangle(smallBounds).addTo(map);

var indexGrid = L.gmxIndexGrid();

console.log(rect2);
