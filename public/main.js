
let trash = document.getElementsByClassName("fa-eraser");
let star = document.getElementsByClassName("fa-star");

Array.from(star).forEach(function (element) {
  element.addEventListener('click', function () {
    const simplified = document.getElementById('answer').innerText
    const newValue = true
    console.log(simplified)
    fetch('/saved', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'simplified': simplified,
        'saved': newValue,
      })
    })
      .then(response => {
        if (response.ok) return response.json()
      })
      .then(data => {
        console.log(data)
        window.location.reload(true)
      })
  })
})

Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        const remove = this.parentNode.parentNode.childNodes[1].innerText
        console.log(remove)

        fetch('delete', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'simplified': remove,
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});

// document.querySelector('button').addEventListener('click', createEvent)

// function createEvent () {
//   document.querySelector('.otherBubble').innerText= ``

//   getElementsByClassName('.otherBubble').classList.replace('hidden', 'visible')
// }