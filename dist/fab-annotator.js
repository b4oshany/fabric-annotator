/**
 * @author:      Oshane Bailey
 * @package:     Fabric Image Annotator
 * @version:     v1.0.2
 */

var min = 99;
var max = 999999;
var polygonMode = true;
var pointArray = new Array();
var lineArray = new Array();
var activeLine;
var activeShape = false;
var annoFabric = new function (imageElement, options) {

    var _this = this;
    this.canvas = null;
    this.vpW = window.innerWidth;
    this.vpH = window.innerHeight;

    //    this.$image = $(".fab-annotate");

    this.cid = generateCid();

    this.loadFromJSON = function (json) {
        this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function (o, object) {
            fabric.log(o, object);
        });
    };

    this.loadFromLocalStorage = function (key) {
        if (key == undefined) {
            key = "anno-canvas";
        }
        var json = localStorage.getItem(key);
        if (json != undefined) {
            this.loadFromJSON(JSON.parse(json));
        }
    }

    this.saveToLocalStorage = function (key) {
        if (key == undefined) {
            key = "anno-canvas";
        }
        localStorage.setItem(key, JSON.stringify(this.canvas.toJSON()));
    }


    this.scaleCanvas = function (factor) {
        if (factor == undefined) {
            factor = 3;
        }
        _this.canvas.setHeight(_this.canvas.getHeight() * factor);
        _this.canvas.setWidth(_this.canvas.getWidth() * factor);
        if (_this.canvas.backgroundImage) {
            // Need to scale background images as well
            var bi = _this.canvas.backgroundImage;
            bi.width = bi.width * factor;
            bi.height = bi.height * factor;
        }
        var objects = _this.canvas.getObjects();
        for (var i in objects) {
            var scaleX = objects[i].scaleX;
            var scaleY = objects[i].scaleY;
            var left = objects[i].left;
            var top = objects[i].top;

            var tempScaleX = scaleX * factor;
            var tempScaleY = scaleY * factor;
            var tempLeft = left * factor;
            var tempTop = top * factor;

            objects[i].scaleX = tempScaleX;
            objects[i].scaleY = tempScaleY;
            objects[i].left = tempLeft;
            objects[i].top = tempTop;

            objects[i].setCoords();
        }
        _this.canvas.renderAll();
        _this.canvas.calcOffset();
    }


    this.addAnnotationText = function () {

    }

    $(document).on("click", ".deleteCanvasObjectBtn", function (e) {
        if (_this.canvas.getActiveObject()) {
            _this.canvas.remove(_this.canvas.getActiveObject());
            $("#fab-popover").popover("hide");
        }
    });

    $(document).on("click", ".editCanvasObjectBtn", function (e) {
        if (_this.canvas.getActiveObject()) {
            var group = _this.canvas.getActiveObject();
            var ctext = group.item(1);
            $('[name="annotation-text-field"]').val(ctext.getText());
        }
        $("#fab-popover").popover("hide");
        $("#annotationModal").modal("show");
    });

    $(document).on("click", ".annotation-save", function (e) {
        if (_this.canvas.getActiveObject()) {
            var group = _this.canvas.getActiveObject();
            var ctext = group.item(1);
            var value;
            if (_this.options.storeAnnotation != undefined) {
                value = _this.options.storeAnnotation(ctext);
            } else {
                value = $("[name='annotation-text-field']").val();
            }
            ctext.setText(value);
            $(".fab-popover-content").html(value);
            _this.canvas.renderAll();
        }
    });

    this.movePopover = function (x, y) {
        var btnLeft = x - 10;
        var btnTop = y - 10;
        $("#fab-popover").css("top", btnTop);
        $("#fab-popover").css("left", btnLeft);
    };



    this.initCanvas = function (imageElement, options) {

        if (options == undefined) {
            this.options = {};
        } else {
            this.options = options;
        }

        if (imageElement == undefined || imageElement == null) {
            this.$image = $(".fab-annotate");
        } else {
            this.$image = $(imageElement);
        }
        var canvasEl = '<div class="fab-canvas">' +
            '<canvas id="c' + this.cid + '"></canvas>' +
            '<div class="fab-annotate-btn"><span class="fab-icon"></span>' +
            '<span class="fab-help">Click and Drag to Annotate</span></div>' +
            '</div>';
        $(canvasEl).insertAfter(this.$image);

        $(document).on("click", '.fab-annotate-btn', function () {
            annoFabric.polygon.drawPolygon();
        });

        if (options != undefined) {
            this.options = options;
        }

        this.$image.addClass("fab-hide");
        vimage = this.$image;

        var canvasHeight = this.$image[0].naturalHeight;
        var canvasWidth = this.$image[0].naturalWidth;
        if (this.options.canvasHeight != undefined) {
            canvasHeight = this.options.canvasHeight;
        }
        if (this.options.canvasWidth != undefined) {
            canvasWidth = this.options.canvasWidth;
        }

        //canvas.selection = false;
        console.log("Set canvas to: " + this.$image[0].naturalWidth + " by " + this.$image[0].naturalHeight);
        _this.canvas = window._canvas = new fabric.Canvas(
            'c' + this.cid, {
                width: canvasWidth,
                height: canvasHeight
            });

        _this.canvas.setBackgroundImage(this.$image.attr("src"));
        _this.canvas.renderAll();
        setTimeout(function () {
            resizeCanvasBackground = setInterval(function(){
                try{
                    _this.canvas.backgroundImage.setWidth(canvasWidth);
                    _this.canvas.backgroundImage.setHeight(canvasHeight);
                    _this.canvas.renderAll();
                    clearTimeout(resizeCanvasBackground);
                }catch(e){
                    console.log("Resetting image size");
                }
            }, 1000);
        }, 1000);

        var inputField = '<input class="form-control" placeholder="Enter Annotation" type="text" id="annotation-text-field" name="annotation-text-field" />';
        if (this.options.annotationTextField != undefined) {
            inputField = this.options.annotationTextField;
        }


        var modalHtml = ('<div id="annotationModal" class="modal fade" tabindex="-1" role="dialog">' +
            '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '<h4 class="modal-title">Set Annotation Text</h4>' +
            '</div>' +
            '<div class="modal-body">' + inputField +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '<button type="button" data-dismiss="modal" class="btn btn-primary annotation-save">Save changes</button>' +
            '</div></div></div></div>');
        $("body").append(modalHtml);

        var toggleEdit = "fab-enable-edit-buttons";
        if (this.options.enableEdit == false) {
            toggleEdit = "fab-disable-edit-buttons";
        }


        var popoverHtnl = ('<div data-toggle="popover"' +
            'data-trigger="focus"' +
            'title="Annotation"' +
            'role="button"' +
            'data-placement="bottom"' +
            'data-html="true"' +
            'id="fab-popover"' +
            'data-delay="1000"' +
            'data-content="<div class=\'fab-main-popover\'><div class=\'fab-popover-content\'></div><div class=\'fab-popover-buttons ' + toggleEdit + ' \'><button type=\'button\' class=\'btn btn-primary btn-sm icon-edit editCanvasObjectBtn canvasObjectBtn\' data-dismiss=\'modal\'>Edit</button><button type=\'button\' class=\'btn btn-danger icon-trash deleteCanvasObjectBtn btn-sm canvasObjectBtn\' data-dismiss=\'modal\'>Delete</button></div></div>">.</div>');
        $("body").append(popoverHtnl);

        $(window).on("resize", function () {
            console.log("resize canvas");
            _this.scaleCanvas();
        });

        _this.canvas.on('object:selected', function (e) {
            console.log(e.target.oCoords);
            _this.movePopover(
                e.target.oCoords.tr.x - (e.target.width / 2),
                e.target.oCoords.tr.y + (e.target.height )
            );
            $("#fab-popover").popover("show");
            var ctext = e.target.item(1);
            $(".fab-popover-content").html(ctext.getText());
        });

        _this.canvas.on('object:modified', function (e) {
            _this.movePopover(
                e.target.oCoords.tr.x - (e.target.width / 2),
                e.target.oCoords.tr.y + (e.target.height )
            );
        });

        _this.canvas.on('object:scaling', function (e) {
            $("#fab-popover").popover("hide");
        });
        _this.canvas.on('object:moving', function (e) {
            $("#fab-popover").popover("hide");
        });
        _this.canvas.on('object:rotating', function (e) {
            $("#fab-popover").popover("hide");
        });

        _this.canvas.on('mouse:down', function (options) {
            if (options.target && options.target.id == pointArray[0].id) {
                var curpoly = annoFabric.polygon.generatePolygon(pointArray);
                _this.movePopover(curpoly.oCoords.tr.x, curpoly.oCoords.tr.y);
                _this.canvas.setActiveObject(curpoly);
                setTimeout(function () {
                    var group = _this.canvas.getActiveObject();
                    var ctext = group.item(1);
                    $('[name="annotation-text-field"]').val(ctext.getText());
                    $("#annotationModal").modal("show");
                }, 1000);
            }
            if (polygonMode) {
                annoFabric.polygon.addPoint(options);
            }
            $("#fab-popover").popover("hide");
        });
        _this.canvas.on('mouse:up', function (options) {

        });
        _this.canvas.on('mouse:over', function (e) {
            if (e.target != undefined && e.target.type == "group") {
                e.target.setStroke("black");
                var ctext = e.target.item(1);
                ctext.visible = false;
                _this.movePopover(
                    e.target.oCoords.tr.x - (e.target.width / 2),
                    e.target.oCoords.tr.y + (e.target.height )
                );
                $("#fab-popover").popover("show");
                $(".fab-popover-content").html(ctext.getText());
            }
            _this.canvas.renderAll();
        });

        _this.canvas.on('mouse:out', function (e) {
            if (e.target != undefined && e.target.type == "group") {
                e.target.setStroke("#ccc");
                var ctext = e.target.item(1);
                ctext.visible = false;
                $("#fab-input-field").popover("hide");
            }
            _this.canvas.renderAll();
        });

        _this.canvas.on('selection:cleared', function () {
            $("#fab-popover").popover("hide");
        });

        _this.canvas.on('mouse:move', function (options) {
            if (activeLine && activeLine.class == "line") {
                var pointer = _this.canvas.getPointer(options.e);
                activeLine.set({
                    x2: pointer.x,
                    y2: pointer.y
                });

                var points = activeShape.get("points");
                points[pointArray.length] = {
                    x: pointer.x,
                    y: pointer.y
                }
                activeShape.set({
                    points: points
                });
                _this.canvas.renderAll();
            }
            _this.canvas.renderAll();
        });
    };
};


function generateCid() {
    var random = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Date().getTime() + random;
}

annoFabric.polygon = {
    drawPolygon: function () {
        polygonMode = true;
        pointArray = new Array();
        lineArray = new Array();
        activeLine;
    },
    addPoint: function (options) {
        var random = Math.floor(Math.random() * (max - min + 1)) + min;
        var id = new Date().getTime() + random;
        var circle = new fabric.Circle({
            radius: 5,
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 0.5,
            left: options.e.layerX,
            top: options.e.layerY,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            originX: 'center',
            originY: 'center',
            id: id
        });
        if (pointArray.length == 0) {
            circle.set({
                fill: 'red'
            })
        }
        var points = [options.e.layerX, options.e.layerY, options.e.layerX, options.e.layerY];
        line = new fabric.Line(points, {
            strokeWidth: 2,
            fill: '#999999',
            stroke: '#999999',
            class: 'line',
            originX: 'center',
            originY: 'center',
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false
        });
        if (activeShape) {
            var pos = annoFabric.canvas.getPointer(options.e);
            var points = activeShape.get("points");
            points.push({
                x: pos.x,
                y: pos.y
            });
            var polygon = new fabric.Polygon(points, {
                stroke: '#333333',
                strokeWidth: 1,
                fill: '#cccccc',
                opacity: 0.1,
                selectable: false,
                hasBorders: false,
                hasControls: false,
                evented: false
            });
            annoFabric.canvas.remove(activeShape);
            annoFabric.canvas.add(polygon);
            activeShape = polygon;
            annoFabric.canvas.renderAll();
        } else {
            var polyPoint = [{
                x: options.e.layerX,
                y: options.e.layerY
            }];
            var polygon = new fabric.Polygon(polyPoint, {
                stroke: '#333333',
                strokeWidth: 1,
                fill: '#cccccc',
                opacity: 0.1,
                selectable: false,
                hasBorders: false,
                hasControls: false,
                evented: false
            });
            activeShape = polygon;
            annoFabric.canvas.add(polygon);
        }
        activeLine = line;

        pointArray.push(circle);
        lineArray.push(line);

        annoFabric.canvas.add(circle);
        annoFabric.canvas.add(line);
        annoFabric.canvas.selection = false;
    },
    generatePolygon: function (pointArray) {
        var points = new Array();
        $.each(pointArray, function (index, point) {
            points.push({
                x: point.left,
                y: point.top
            });
            annoFabric.canvas.remove(point);
        });
        $.each(lineArray, function (index, line) {
            annoFabric.canvas.remove(line);
        });
        annoFabric.canvas.remove(activeShape).remove(activeLine);
        var polygon = new fabric.Polygon(points, {
            stroke: '#333333',
            strokeWidth: 0.5,
            fill: 'rgba(0, 0, 0, 0)',
            opacity: 1,
            hasBorders: false,
            hasControls: false
        });

        var cText = new fabric.Text('Tap and Type', {
            fontFamily: 'arial black',
            fill: "white",
            fontSize: 12,
            left: polygon.left + (polygon.width / 2),
            top: polygon.top + (polygon.height / 2),
            visible: false
        });


        group = new fabric.Group([polygon, cText], {
            left: polygon.left,
            top: polygon.top
        });
        annoFabric.canvas.add(group);

        activeLine = null;
        activeShape = null;
        polygonMode = false;
        annoFabric.canvas.selection = true;
        return group;
    }
};
