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

  //item action buttons
  $("a.item-action-btn").on("click", e => {
    e.preventDefault();

    //get clicked link element
    const elem = $(e.target).parents("a.item-action-btn");

    //post request settings
    const settings = {
      data: {
        //get item name
        name: elem.parent().siblings("td.item-name").children("b").text()
      },
      success: () => location.reload() //reload page on complete
    };

    //add to settings depending on type of button
    if (elem.hasClass("out-btn") || elem.hasClass("in-btn")) {
      //get amount if specified
      let amount = 1;
      const givenAmount = parseInt(
        elem.siblings("div.input-field").children("input.amount-field").val(), 10);
      if (givenAmount) {
        amount = givenAmount;
      }

      //set url
      settings.url = "/update";

      //put into settings
      settings.data.amount = amount;

      //set if in or out
      settings.data.direction = elem.hasClass("out-btn") ? "out" : "in";
    } else if (elem.hasClass("disable-btn")) {
      //set url to disable
      settings.url = "/disable";
    } else {
      //shouldn't actually happen
      return;
    }

    //send post request to server
    $.post(settings);
  });
});
