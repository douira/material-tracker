/*jshint browser: true, jquery: true */

//on page ready
$(document).ready(() => {
  //add item form
  $("a#add-item-btn").on("click", e => {
    //don't follow
    e.preventDefault();
    console.log("click");
    //check for stuff in field
    if ($("input#add-item-field").val()) {
      //submit form to add item
      $("form#add-item-form").submit();
    }
  });
});
