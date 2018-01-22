
$(window).on("load", function(){
   $(document).on("change", 'input:radio', function(){
      var radioval = $(this).val();
      var post_id  = $(this).attr("data-post-id");
      console.log(radioval);
      console.log(post_id);


      var labelValue = (radioval === "true") ? 1 : ( (radioval === "false") ? 0 : -1);
      if (labelValue !== -1) {

         $.ajax({
            url: './register',
            type: 'GET',
            data: {
               "post-id": post_id,
               "label": labelValue
            },
            dataType: "text"
         })
         .done(function (data, textStatus, jqXHR) {
            $("div[data-post-id=" + post_id + "]").remove();
            if ($("main div.post-wrapper").length === 0) {
               requestData();
            }

         })
         .fail(function (jqXHR, textStatus, errorThrown) {
            console.error(textStatus);
            console.error(errorThrown);
         });

      }
   });

   requestData();
});

function requestData() {
   $.ajax({
      url:      './request',
      type:     'GET',
      data:     {index:0},
      dataType: "text"
   })
   .done(function(data, textStatus, jqXHR){
      //
      // console.log(data);
      // console.log(typeof data)
      var json_data = JSON.parse(data);
      for (var i = 0; i < json_data.length; i++) {
         var wrapperDiv = $("<div class='post-wrapper' data-post-id=" + json_data[i]["id"] + ">");
         wrapperDiv.append(json_data[i]["html"]);
         wrapperDiv.append('<div><form class="label-selector">' +
            '<input data-post-id="' + json_data[i]["id"] + '" type="radio" name="label-' + json_data[i]["id"] + '" value="true">True' +
            '<input data-post-id="' + json_data[i]["id"] + '" type="radio" name="label-' + json_data[i]["id"] + '" value="false">False' +
            "</form></div>");
         $("main").append(wrapperDiv);
      }
   })
   .fail(function(jqXHR, textStatus, errorThrown){
      console.error(textStatus);
      console.error(errorThrown);
   });
}