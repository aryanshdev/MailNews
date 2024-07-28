function submitQuery() {
    fetch("/addQuery", {
      method: "POST",
      body: new URLSearchParams({
        date: (new Date().toISOString().split('T')[0]),
        message: document.forms["queryForm"].message.value,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then(async (res) => {
      if (res.status == 200) { 
        document.querySelector(
          'form[name="queryForm"]'
        ).innerHTML = `<h3 class="text-xl my-4 capitalize col-span-2 text-center"> Your Query/Issue has been registered with ID : <span class="font-bold block"> ${await res.json()} </span> You Can also Find all Raised Issues/Queries in your  <a class="text-fuchsia-500 block mt-2 font-bold" href="/signin">Account Dashboard</a></h3>`;
      }
    });
  }
  document.getElementById("queryForm").addEventListener("submit", submitQuery)