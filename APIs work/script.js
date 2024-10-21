function display_diptis (){
    $.ajax({
        url: "https://reqres.in/api/users",
        method: "GET",
        dataType: "json",
        success: handleResponse,
        error: function (error) {
          console.error("Error fetching stories:", error);
        },
      });
}

function delete_diptis (){
    let Dipti_Id = $(this).attr("data-id");
    $.ajax({
        url: "https://reqres.in/api/users/" + Dipti_Id,
        method: "DELETE",
        success: function () {
            display_diptis(); 
        },
        error: function (error) {
            console.error("Error deleting story:", error);
        },
    });
}

function handleFormSubmission(event) {
    event.preventDefault();
    let Dipti_Id = $("#createBtn").attr("data-id");
    var name = $("#createName").val();
    var email = $("#createemail").val();
    var src = $("#createurl").val();
    $.ajax({
        url: "https://reqres.in/api/users/",
        method: "POST",
        data: { name, email },
        success: function (response) {
            $("#Data_list").prepend(`
              <div class="mb-3">
                  <h3>${response.name}</h3>
                  <div>${response.email}</div>
                  <img src="${src}" alt="Story Image" class="img-fluid" />
                  <div>
                      <button class="btn btn-info btn-sm mr-2 btn-edit mt-5" data-id="new">Edit</button>
                      <button class="btn btn-danger btn-sm mr-2 btn-del mt-5" data-id="new">Delete</button>
                  </div>
              </div>
              <hr />
            `);
            
            $("#createname").val("");
            $("#createemail").val("");
          },
        error: function (error) {
          console.error("Error creating story:", error);
        },
    });
}


function handleResponse(diptiyan){
    var storiesList = document.getElementById("Data_list");

    storiesList.innerHTML = "";

    diptiyan.data.forEach(dipti => {
        storiesList.insertAdjacentHTML('beforeend',
            `<div class="mb-3">
                  <h3>${dipti.first_name}</h3>
                  <div>${dipti.email}</div>
                  <img src="${dipti.avatar}" alt="Story Image" class="img-fluid" />
                  <div>
                      <button class="btn btn-info btn-sm mr-2 btn-edit mt-5" data-id="${dipti.id}">Edit</button>
                      <button class="btn btn-danger btn-sm mr-2 btn-del mt-5" data-id="${dipti.id}">Delete</button>
                  </div>
              </div>
              <hr />
            `
          );
    });
}

document.addEventListener("DOMContentLoaded",()=>{
    display_diptis();
    $(document).on("click", ".btn-del", delete_diptis);

    $("#createForm").submit(handleFormSubmission);
});