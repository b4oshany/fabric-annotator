var min = 99;
var max = 999999;
var polygonMode = true;
var pointArray = new Array();
var lineArray = new Array();
var activeLine;
var activeShape = false;
var canvas;
$(document).ready(function () {
    prototypefabric.initCanvas();
    $(document).on("click", '.fab-annotate-btn', function () {
        console.log("Enable drawing");
        prototypefabric.polygon.drawPolygon();
    });
});
var prototypefabric = new function (imageElement, options) {
    var _this = this;
    this.vpW = window.innerWidth;
    this.vpH = window.innerHeight;

    if(imageElement == undefined){
        this.$image = $(".fab-annotate");
    }else{
        this.$iamge = $(imageElement);
    }

    this.cid = generateCid();
    var canvasEl = '<div class="fab-canvas">' +
        '<canvas id="c' + this.cid + '"></canvas>' +
        '<div class="fab-annotate-btn"><span class="fab-icon"></span>' +
        '<span class="fab-help">Click and Drag to Annotate</span></div>' +
    '</div>';
    $(canvasEl).insertAfter(this.$image);


    this.innputField = "<input class='form-control' placeholder='Enter Annotation' type='text' id='annotation-text-box' name='annotation-text-box' />";


    this.scaleCanvas = function (factor) {
        if (factor == undefined) {
            factor = 3;
        }
        canvas.setHeight(canvas.getHeight() * factor);
        canvas.setWidth(canvas.getWidth() * factor);
        if (canvas.backgroundImage) {
            // Need to scale background images as well
            var bi = canvas.backgroundImage;
            bi.width = bi.width * factor;
            bi.height = bi.height * factor;
        }
        var objects = canvas.getObjects();
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
        canvas.renderAll();
        canvas.calcOffset();
    }

    this.promptAnnotationText = function (polygon) {
        console.log(polygon);
    }

    this.addAnnotationText = function () {

    }

    $(document).on("click", ".deleteCanvasObjectBtn", function (e) {
        console.log("delete item:");
        console.log(canvas.getActiveObject());
        if (canvas.getActiveObject()) {
            canvas.remove(canvas.getActiveObject());
            $(".canvasObjectBtn").remove();
        }
    });

    $(document).on("click", ".editCanvasObjectBtn", function (e) {
        console.log("edit item:");
        console.log(canvas.getActiveObject());
        if (canvas.getActiveObject()) {
            var group = canvas.getActiveObject();
            var cgtext = group.item(1);
            var ctext = cgtext.item(2);
            $('[name="annotation-text-box"]').val(ctext.getText());
        }
        $("#annotationModal").modal("show");
    });

    $(document).on("click", ".annotation-save", function (e) {
        console.log("save annotation");
        console.log(canvas.getActiveObject());
        if (canvas.getActiveObject()) {
            var group = canvas.getActiveObject();
            var cgtext = group.item(1);
            var ctext = cgtext.item(2);
            var value = $("#annotation-text-box").val();
            ctext.setText(value);
            canvas.renderAll();
        }
    });

    this.addDeleteBtn = function (x, y) {
        $(".canvasObjectBtn").remove();
        var btnLeft = x - 10;
        var btnTop = y - 10;
        var deleteCanvasObjectBtn = '<a href="#" class="icon-trash deleteCanvasObjectBtn canvasObjectBtn" style="position:absolute;top:' + btnTop + 'px;left:' + btnLeft + 'px;cursor:pointer;width:16px;height:16px;"></a>';
        $(".canvas-container").append(deleteCanvasObjectBtn);
    }

    this.addEditBtn = function (x, y) {
        $(".canvasObjectEditBt").remove();
        var btnLeft = x - 10;
        var btnTop = y - 10;
        var addCanvasObjectBtn = '<a href="#" class="icon-edit editCanvasObjectBtn canvasObjectBtn" style="position:absolute;top:' + btnTop + 'px;left:' + btnLeft + 'px;cursor:pointer;width:16px;height:16px;"></a>';
        $(".canvas-container").append(addCanvasObjectBtn);
    }



    this.initCanvas = function () {
        this.$image.addClass("fab-hide");
        vimage = this.$image;

        //canvas.selection = false;
        console.log("Set canvas to: " + this.$image[0].naturalWidth + " by " + this.$image[0].naturalHeight);
        canvas = window._canvas = new fabric.Canvas(
            'c' + this.cid, {
                width: this.$image[0].naturalWidth,
                height: this.$image[0].naturalHeight
        });

        canvas.setBackgroundImage(this.$image.attr("src"));
        canvas.renderAll();


        var modalHtml = ('<div id="annotationModal" class="modal fade" tabindex="-1" role="dialog">' +
            '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '<h4 class="modal-title">Set Annotation Text</h4>' +
            '</div>' +
            '<div class="modal-body">' +
            '<input class="form-control" placeholder="Enter Annotation" type="text" id="annotation-text-box" name="annotation-text-box" />' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '<button type="button" data-dismiss="modal" class="btn btn-primary annotation-save">Save changes</button>' +
            '</div></div></div></div>');
        $("body").append(modalHtml);

        $(window).on("resize", function () {
            console.log("resize canvas");
            _this.scaleCanvas();
        });

        canvas.on('object:selected', function (e) {
            _this.addDeleteBtn(e.target.oCoords.tr.x, e.target.oCoords.tr.y);
            _this.addEditBtn(e.target.oCoords.tr.x - 30, e.target.oCoords.tr.y);
        });

        canvas.on('object:modified', function (e) {
            _this.addDeleteBtn(e.target.oCoords.tr.x, e.target.oCoords.tr.y);
            _this.addEditBtn(e.target.oCoords.tr.x - 30, e.target.oCoords.tr.y);
        });

        canvas.on('object:scaling', function (e) {
            $(".canvasObjectBtn").remove();
        });
        canvas.on('object:moving', function (e) {
            $(".canvasObjectBtn").remove();
        });
        canvas.on('object:rotating', function (e) {
            $(".canvasObjectBtn").remove();
        });

        canvas.on('mouse:down', function (options) {
            if (options.target && options.target.id == pointArray[0].id) {
                var curpoly = prototypefabric.polygon.generatePolygon(pointArray);
                _this.promptAnnotationText(curpoly);
            }
            if (polygonMode) {
                prototypefabric.polygon.addPoint(options);
            }
        });
        canvas.on('mouse:up', function (options) {

        });
        canvas.on('mouse:over', function (e) {
            console.log(e.target);
            console.log(e.target.type);
            if (e.target.type == "group") {
                e.target.setStroke("black");
                var ctext = e.target.item(1);
                //                e.target.setFill("rgba(0, 0, 0, .3)");\
                ctext.visible = true;
            }
            canvas.renderAll();
        });

        canvas.on('mouse:out', function (e) {
            console.log(e.target);
            console.log(e.target.type);
            if (e.target.type == "group") {
                e.target.setStroke("#ccc");
                //                e.target.setFill("rgba(0, 0, 0, 0)");
                var ctext = e.target.item(1);
                ctext.visible = false;
            }
            //            $(".canvasObjectBtn").remove();
            canvas.renderAll();
        });

        canvas.on('selection:cleared', function () {
            $(".canvasObjectBtn").remove();
        });

        canvas.on('mouse:move', function (options) {
            if (activeLine && activeLine.class == "line") {
                var pointer = canvas.getPointer(options.e);
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
                canvas.renderAll();
            }
            canvas.renderAll();
        });
    };
};


function generateCid(){
    var random = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Date().getTime() + random;
}

prototypefabric.polygon = {
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
            var pos = canvas.getPointer(options.e);
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
            canvas.remove(activeShape);
            canvas.add(polygon);
            activeShape = polygon;
            canvas.renderAll();
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
            canvas.add(polygon);
        }
        activeLine = line;

        pointArray.push(circle);
        lineArray.push(line);

        canvas.add(circle);
        canvas.add(line);
        canvas.selection = false;
    },
    generatePolygon: function (pointArray) {
        var points = new Array();
        $.each(pointArray, function (index, point) {
            points.push({
                x: point.left,
                y: point.top
            });
            canvas.remove(point);
        });
        $.each(lineArray, function (index, line) {
            canvas.remove(line);
        });
        canvas.remove(activeShape).remove(activeLine);
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
            left: polygon.left + ( polygon.width / 2),
            top: polygon.top + (polygon.height / 2)
        });

        var textHolder = new fabric.Rect({
            width: cText.width + 40,
            height: cText.height + 40,
            left: cText.left - 20,
            top: cText.top - 20,
            fill: 'black'
        });
        var tip = new fabric.Triangle({
            width: 30,
            height: 20,
            fill: 'black',
            left: textHolder.left + 10,
            top: textHolder.top - 20
        });

        var tooltip = new fabric.Group([textHolder, tip, cText], {
            left: cText.left - 20,
            top: cText.top - 20
        });


        group = new fabric.Group([polygon, tooltip], {
            left: polygon.left,
            top: polygon.top
        });
        canvas.add(group);

        activeLine = null;
        activeShape = null;
        polygonMode = false;
        canvas.selection = true;
        return group;
    }
};
