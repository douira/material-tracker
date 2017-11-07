/*jshint browser: true, jquery: true */

//on page ready
$(document).ready(() => {
  //link up submit button and input field
  $("a#submit-btn").on("click", e => {
    //don't follow link
    e.preventDefault();

    //submit form is a code is present
    if ($("input#code-input").val()) {
      $("form#code-form").submit();
    }
  });
});
