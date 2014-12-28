!function () {
var gridSteps = [0.001, 0.002, 0.0025, 0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 30, 60, 120, 180],
    gridStepsLength = gridSteps.length,
    formatFloat = function (f) {
        f %= 360;
        if (f > 180) f -= 360;
        else if (f < -180) f += 360;
        return Math.round(f*1000.0)/1000.0;
    };

L.GmxGrid = L.Polyline.extend({
    options: {
        isOneDegree: false,  // draw with 1°
        color: 'black',
        noClip: true,
        clickable: false
    },

    initialize: function (options) {
        L.Polyline.prototype.initialize.call(this, [], options);
    },

    setColor: function (color) {
        this.options.color = color;
        this.repaint();
    },

    setOneDegree: function (flag) {
        this.options.isOneDegree = flag;
        this.repaint();
    },

    onAdd: function (map) {
        L.Polyline.prototype.onAdd.call(this, map);
        map.on('move', this.repaint, this);
        this.repaint();
    },

    onRemove: function (map) {
        map.off('move', this.repaint, this);
        L.Polyline.prototype.onRemove.call(this, map);
    },

    repaint: function() {
        if (!this._map) return;
        var map = this._map,
            w = map._size.x / 80,
            h = map._size.y / 80,
            vBounds = map.getBounds(),
            vpNorthWest = vBounds.getNorthWest(),
            vpSouthEast = vBounds.getSouthEast(),
            x1 = vpNorthWest.lng,   x2 = vpSouthEast.lng,
            y1 = vpSouthEast.lat,   y2 = vpNorthWest.lat,
            x21 = x2 - x1,   y21 = y2 - y1,
            xStep = 0, yStep = 0,
            isOneDegree = this.options.isOneDegree;
        if(isOneDegree) {
            xStep = yStep = 1;
        } else {
            for (var i = 0; i < gridStepsLength; i++) {
                var step = gridSteps[i];
                if (xStep == 0 && x21/step < w) xStep = step;
                if (yStep == 0 && y21/step < h) yStep = step;
                if (xStep > 0 && yStep > 0) break;
            }
        }

        var zoom = map.getZoom(),
            latlngArr = [],
            textMarkers = [];
        
        for (var i = Math.floor(x1/xStep), len1 = Math.ceil(x2/xStep); i < len1; i++) {
            var x = i * xStep;
            latlngArr.push(new L.LatLng(y2, x), new L.LatLng(y1, x));
            if(isOneDegree && zoom < 6) continue;
            textMarkers.push(formatFloat(x) + "°", '');
        }
        for (var i = Math.floor(y1/yStep), len1 = Math.ceil(y2/yStep); i < len1; i++) {
            var y = i * yStep;
            latlngArr.push(new L.LatLng(y, x1), new L.LatLng(y, x2));
            if(isOneDegree && zoom < 6) continue;
            textMarkers.push(formatFloat(y) + "°", '');
        }
        this.setStyle({'stroke': true, 'weight': 1, 'color': this.options.color});
        this.options.textMarkers = textMarkers;
        this.setLatLngs(latlngArr);
        return false;
    },

    _getPathPartStr: function (points) {
        if(this._containerText) this._container.removeChild(this._containerText);
        this._containerText = this._createElement('g');
        this._containerText.setAttribute("stroke-width", 0);

        var color = this._path.getAttribute("stroke");
        this._containerText.setAttribute("stroke", color);
        this._containerText.setAttribute("fill", color);
        this._containerText.setAttribute("opacity", 1);
        this._container.appendChild(this._containerText);

        var round = L.Path.VML,
            options = this.options;
        for (var j = 0, len2 = points.length, str = '', p, p1; j < len2; j+=2) {
            p = points[j];
            p1 = points[j+1];
            if (round) {
                p._round();
                p1._round();
            }
            str += 'M' + p.x + ' ' + p.y;
            str += 'L' + p1.x + ' ' + p1.y;
            if(options.textMarkers && options.textMarkers[j]) {
                var text = this._createElement('text'),
                    dx = 0,
                    dy = 3;
                if(p.y == p1.y) dx = 20;
                if(p.x == p1.x) {
                    text.setAttribute("text-anchor", "middle");
                    dy = 20;
                }
                text.setAttribute('x', p.x + dx);
                text.setAttribute('y', p.y + dy);
                text.textContent = options.textMarkers[j];
                this._containerText.appendChild(text);
            }
        }
        return str;
    }
    ,
    _updatePath: function () {
        if (!this._map) { return; }
        this._clipPoints();
        L.Path.prototype._updatePath.call(this);
    }
});
L.gmxGrid = function (options) {
  return new L.GmxGrid(options);
}
}();