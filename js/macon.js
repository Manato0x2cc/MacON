/**
 * @author Manato0x2cc
 * @version 1.0.0
 *
 *  __  __             ___  _   _
 * |  \/  | __ _  ___ / _ \| \ | |
 * | |\/| |/ _` |/ __| | | |  \| |
 * | |  | | (_| | (__| |_| | |\  |
 * |_|  |_|\__,_|\___|\___/|_| \_|
 *
 * MacON, the software which can paste your image to the coolest mac images.
 *
 * Copyright (c) 2017 Manato0x2cc
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */

$(function() {

    var now_page = 0;

    const PAGES = ["welcome", "select-mac-theme", "upload-image"]

    /**
     * Button event
     */
    $("#create-button").on('click', function(e) {

        now_page++;

        $('#welcome').hide();
        $('#select-mac-theme').fadeIn(2000);

        $('#fixed-button').show();

        //slide start
        $("#Glide").glide({
            type: "carousel",
            autoplay: false //No autoplay
        });
    })

    /**
     * back button
     */
     $("#fixed-button").on('click', function(e) {
        $(`#${PAGES[now_page]}`).hide();
        now_page--;
        $(`#${PAGES[now_page]}`).fadeIn(2000);
        if(now_page === 0) $("#fixed-button").hide();
     })
    var type;
    var name;
    var src
    /**
     * Mac Image selected
     */
    $(".mac-image").on('click', function(e) {

        var selectedImage = $(this);
        type = getTypefromString($("input[name='size']:checked").val());
        name = $(this).attr("id");

        src = `image\/mac\/${$("input[name='size']:checked").val()}\/${name}.png`;

        now_page++;

        $('#select-mac-theme').hide();
        $('#upload-image').fadeIn(2000);

        $('#upload-image').html(
          `<p><h2>Select your Image</h2></p>`+
          `<div class="col-md-6 col-xs-0 text-center">`+
            `<img src="${selectedImage.attr('src')}" id="selected"></img>`+
          `</div>`+
          `<div id="drop-zone" class="col-md-6 col-xs-12">Drag file here</div>`+
          `</div>`+
          `<div class="row">`+
            `<div class="col-xs-10 col-md-10 col-md-offset-1 col-xs-offset-1">`+
              `<br>`+
              `<button class="btn btn-success" style="width:100%;" id="upload-button">Upload Image</button>`+
              `<input type="file" accept='image/*' name="img" style="opacity:0; id="input">`+
            `</div>`+
          `</div>`
        )
    })

    /**
     * Upload button pressed
     */

    $(document).on('click', "#upload-button", function(e) {
        $('input[name=img]').trigger('click');
    })

    $(document).on('change', 'input[name=img]', function() {
        if (!this.files.length) {
            return;
        }
        var file = this.files[0];
        upload(file);
    });

    var uploaded; //User uploaded image

    function upload(file) {
        $("#fixed-button").hide();
        $('#now-loading').show();

        fileReader = new FileReader();

        fileReader.onload = function(event) {
            $('#msg').text("Pasting your Image...");
            uploaded = event.target.result;
            createImage();
        };

        fileReader.readAsDataURL(file);
    }


    /*File dragged*/
    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var tmp = evt.originalEvent.dataTransfer.files;
        if (tmp[0].type.split("\/")[0] !== "image") {
            alert("This file is not Image File...");
            return;
        }
        upload(tmp[0]);

    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.originalEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy
    }

    $(document).on('dragover', "#drop-zone", handleDragOver);
    $(document).on('drop', "#drop-zone", handleFileSelect);

    function createImage() {
        $('#upload-image').fadeOut(1);
        $('#result-image').css({'opacity': 0});
        $('#result-image').show();
        var canvas = document.getElementById('canvas');

        var baseImage = new Image();
        var pasteImage = new Image();

        pasteImage.onload = function(e) {

          baseImage.onload = function(e) {

            var baseImageObj = new BaseImage(baseImage, type, name);
            canvas.width = pasteImage.width;
            canvas.height = pasteImage.height;
            var pt = new ProjectiveTransformation('canvas', baseImageObj, pasteImage, function(url) {
                $('#now-loading').hide();
                $("#canvas").hide();
                $('#result-image').css({"opacity": 1}, 2000);

                var downloadURL = url.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                $('#result-image').append(`<img src="${url}" style="max-width: 100%; max-height: 90%;"></img><a download="file-macon.png" href="${downloadURL}"><button class="btn btn-success">Download&nbsp;<i class="fa fa-download" aria-hidden="true"></i></button></a>`);
            });
          }

          baseImage.src = src;
        }
        pasteImage.src = uploaded;
    }

});
