const socket = io()
/* socket.on('countUpdated',(count)=>{
    console.log('The count has been updated',count)
})

document.querySelector('#increment').addEventListener('click',()=>{
    console.log('Clicked')
    socket.emit('increment')
}) */

//Elements
const $messageForm = document.querySelector('#message-form')// from dom
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMsgTemplate = document.querySelector('#location-msg-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options - parsing the query strings 
const qsObj = Qs.parse(location.search,{ignoreQueryPrefix:true})
const{username,room} = qsObj

const autoscroll =() =>{
    //New message element 
    const $newMessage = $messages.lastElementChild

    //Get the height of the newly created message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Get the Visible Height
    const visibleHeight = $messages.scrollHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//locationMessage - receive
socket.on('locationMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(locationMsgTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
//Sidebar room data
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()// prevent page refresh
    //DoM Manipulaion
    $messageFormButton.setAttribute('disabled','disabled')

    //disable
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()
        //enable
        if(error){return console.log(error)}

        console.log('The message was delivered!')
    })

})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            console.log('Location is shared!')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username, room},(error)=>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})
