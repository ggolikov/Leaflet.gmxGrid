(function () {
var KM_PER_DEGREE = 111.31949;

var gridSteps = [0.001, 0.002, 0.0025, 0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 30, 60, 120, 180],
    gridStepsLength = gridSteps.length;

L.GmxGrid = L.Polyline.extend({
    options: {
        // isOneDegree: false,  // draw with 1°
        color: 'black',
        noClip: true,
		weight: 1,
		textWeight: 0,
        defaultStep: {
            x: undefined,
            y: undefined
        },
        customStep: {
            x: undefined,
            y: undefined
        },
        units: 'degrees',
        titleFormat: 0,		// string format for degree titles 0 - decimal, 1 - degree + minutes , 2 - degree + minutes + seconds(decimal)
        clickable: false
    },

    initialize: function (options) {
        L.Polyline.prototype.initialize.call(this, [], options);
    },

    setTextWeight: function (w) {
        this.options.textWeight = w;
        this.repaint();
    },

    setWeight: function (w) {
        this.options.weight = w;
        this.repaint();
    },
    setColor: function (color) {
        this.options.color = color;
        this.repaint();
    },

    // setting grid step (x, y)
    setStep: function (x, y) {
        if (!x || isNaN(x) || x <= 0 ) {
            return;
        }
        if (arguments.length === 1) {
            this.options.customStep.y = this.options.customStep.x = Number(x);
        } else {
            if (!y || isNaN(y) || y <= 0 ) {
                return;
            }
            this.options.customStep.x = Number(x);
            this.options.customStep.y = Number(y);
        }
        this.repaint();
    },

    clearStep: function () {
        this.options.customStep.x = this.options.customStep.y = undefined;
        this.options.units = 'degrees';
        this.repaint();
    },

    setUnits: function (units) {
        if (units === this.options.units) {
            return;
        }
        var centerY = (this._map.getCenter().lat * Math.PI) / 180,
            x = this.options.customStep.x ? this.options.customStep.x : this.options.defaultStep.x,
            y = this.options.customStep.y ? this.options.customStep.y : this.options.defaultStep.y;
        switch (units) {
            case 'kilometers':
                this.options.customStep.x = x * Math.cos(centerY) * KM_PER_DEGREE;
                this.options.customStep.y = y * KM_PER_DEGREE;
            break;
            case 'degrees':
                this.options.customStep.x = (x / KM_PER_DEGREE) / Math.cos(centerY);
                this.options.customStep.y = y / KM_PER_DEGREE;
            break;
            default:
                return;
        }
            this.options.units = units;
    },

    setTitleFormat: function (format) {
        this.options.titleFormat = Number(format);
    },

    onAdd: function (map) {
        L.Polyline.prototype.onAdd.call(this, map);
        map.on('moveend', this.repaint, this);
        this.repaint();
    },

    onRemove: function (map) {
        map.off('moveend', this.repaint, this);
        L.Polyline.prototype.onRemove.call(this, map);
    },

    formatFloat: function (f) {
		if (this.options.titleFormat && L.gmxUtil.formatDegrees) {
			return L.gmxUtil.formatDegrees(f, this.options.titleFormat);
		}
        f %= 360;
        if (f > 180) { f -= 360; }
        else if (f < -180) { f += 360; }
        return Math.round(f * 1000.0) / 1000.0 + '°';
    },

    repaint: function() {
        if (!this._map) { return false; }
        var map = this._map,
            x = this.options.customStep.x,
            y = this.options.customStep.y,
            w = map._size.x / 80,
            h = map._size.y / 80,
            vBounds = map.getBounds(),
            vpNorthWest = vBounds.getNorthWest(),
            vpSouthEast = vBounds.getSouthEast(),
            x1 = vpNorthWest.lng,   x2 = vpSouthEast.lng,
            y1 = vpSouthEast.lat,   y2 = vpNorthWest.lat,
            x21 = x2 - x1,   y21 = y2 - y1,
            i, len1,
            defaultXStep = 0, defaultYStep = 0,
            xStep, yStep,
            // isOneDegree = this.options.isOneDegree,
            units = this.options.units,
            centerY = (map.getCenter().lat * Math.PI) / 180;

        for (i = 0; i < gridStepsLength; i++) {
            var step = gridSteps[i];
            if (defaultXStep === 0 && x21 / step < w) { defaultXStep = step; }
            if (defaultYStep === 0 && y21 / step < h) { defaultYStep = step; }
            if (defaultXStep > 0 && defaultYStep > 0) { break; }
        }

        if (!x && !y) {
            this.options.defaultStep.x = xStep = defaultXStep;
            this.options.defaultStep.y = yStep = defaultYStep;
        } else if (units === 'kilometers') {
            xStep = (x/KM_PER_DEGREE)/Math.cos(centerY);
            yStep = y/KM_PER_DEGREE;
        } else {
            xStep = x;
            yStep = y;
        }

        var latlngArr = [],
            textMarkers = [];

        for (i = Math.floor(x1 / xStep), len1 = Math.ceil(x2 / xStep); i < len1; i++) {
            x = i * xStep;
            latlngArr.push(new L.LatLng(y2, x), new L.LatLng(y1, x));
            if (xStep < defaultXStep || yStep < defaultYStep) {
                if (i % Math.ceil(defaultXStep / xStep) === 0) {
                    textMarkers.push(this.formatFloat(x), '');
                } else {
                    textMarkers.push('', '');
                }
            } else {
                textMarkers.push(this.formatFloat(x), '');
            }
        }
        for (i = Math.floor(y1 / yStep), len1 = Math.ceil(y2 / yStep); i < len1; i++) {
            y = i * yStep;
            latlngArr.push(new L.LatLng(y, x1), new L.LatLng(y, x2));
            if (xStep < defaultXStep || yStep < defaultYStep) {
                if (i % Math.ceil(defaultYStep / yStep) === 0) {
                    textMarkers.push(this.formatFloat(y), '');
                } else {
                    textMarkers.push('', '');
                }
            } else {
                textMarkers.push(this.formatFloat(y), '');
            }
        }
        this.setStyle({'stroke': true, 'weight': this.options.weight, 'color': this.options.color});
        this.options.textMarkers = textMarkers;
        this.setLatLngs(latlngArr);
        return false;
    },

    _getPathPartStr: function (points) {
        if (this._containerText) { this._container.removeChild(this._containerText); }
        this._containerText = this._createElement('g');
        this._containerText.setAttribute('stroke-width', this.options.textWeight);

        var color = this._path.getAttribute('stroke');
        this._containerText.setAttribute('stroke', color);
        this._containerText.setAttribute('fill', color);
        this._containerText.setAttribute('opacity', 1);
        this._container.appendChild(this._containerText);

        var round = L.Path.VML,
            options = this.options;
        for (var j = 0, len2 = points.length, str = '', p, p1; j < len2; j += 2) {
            p = points[j];
            p1 = points[j + 1];
            if (round) {
                p._round();
                p1._round();
            }
            str += 'M' + p.x + ' ' + p.y;
            str += 'L' + p1.x + ' ' + p1.y;
            if (options.textMarkers && options.textMarkers[j]) {
                var text = this._createElement('text'),
                    dx = 0,
                    dy = 3;
                if (p.y === p1.y) { dx = 20; }
                if (p.x === p1.x) {
                    text.setAttribute('text-anchor', 'middle');
                    dy = 20;
                }
                text.setAttribute('x', p.x + dx);
                text.setAttribute('y', p.y + dy);
                text.textContent = options.textMarkers[j];
                this._containerText.appendChild(text);
            }
        }
        return str;
    },
    _updatePath: function () {
        if (!this._map) { return; }
        this._clipPoints();
        L.Path.prototype._updatePath.call(this);
    }
});
L.gmxGrid = function (options) {
  return new L.GmxGrid(options);
};
})();
