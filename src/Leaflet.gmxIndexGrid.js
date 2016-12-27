L.GmxIndexGrid = L.GmxGrid.extend({
    initialize: function () {
        console.log('hi!');
    }
});

L.gmxIndexGrid = function (options) {
    return new L.GmxIndexGrid (options);
};
