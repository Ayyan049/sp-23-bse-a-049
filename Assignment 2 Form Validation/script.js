document.getElementById("checkoutForm").addEventListener("submit", function (event) {
    let valid = true;

    document.getElementById("nameError").innerText = "";
    document.getElementById("emailError").innerText = "";
    document.getElementById("addressError").innerText = "";
    document.getElementById("cityError").innerText = "";

    document.getElementById("name").classList.remove("error-border");
    document.getElementById("email").classList.remove("error-border");
    document.getElementById("address").classList.remove("error-border");
    document.getElementById("city").classList.remove("error-border");

    const name=document.getElementById("name").value;
    if(!name){
      document.getElementById("nameError").innerText="Name is required";
      document.getElementById("name").classList.add("error-border");
      valid=false;
    }

    const email=document.getElementById("email").value;
    if(!email){
      document.getElementById("emailError").innerText="Email is required";
      document.getElementById("email").classList.add("error-border");
      valid=false;
    }

    const address=document.getElementById("address").value;
    if(!address){
      document.getElementById("addressError").innerText="Address is required";
      document.getElementById("address").classList.add("error-border");
      valid=false;
    }

    const city=document.getElementById("city").value;
    if(!city){
      document.getElementById("cityError").innerText="City is required";
      document.getElementById("city").classList.add("error-border");
      valid=false;
    }

    if(!valid){
      event.preventDefault();
    }
  });
