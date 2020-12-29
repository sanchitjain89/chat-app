const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log('The count has not been updated!', count)
// })

// document.querySelector("#increment").addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')
// })

// socket.on("welcome", (message) => {
//     console.log(message)
// })

//Elements
const messageForm = document.querySelector('form')
const inputText = document.querySelector('input')
const $messageFormButton = messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message 
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height 
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset){
        console.log('Here')
        $messages.scrollTop = $messages.scrollHeight
    }
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    const broadcastMessage = inputText.value

    socket.emit('broadcast', broadcastMessage, (error) => {

        inputText.value = ''
        inputText.focus()

        if (error){
            return console.log('Profanilty is not allowed')
        }
        console.log('The message was delivered')
        $messageFormButton.removeAttribute('disabled')
    })
})

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)

        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            console.log('Location shared!')
            $locationButton.removeAttribute('disabled')
        })
    })
})

socket.on('serverMessage', (output) => {
    console.log(output)
    const html = Mustache.render(messageTemplate, {
        username: output.username,
        message: output.text,
        createdAt: moment(output.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        location: url.text,
        timestamp: moment(url.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', {username, room}, (error) => {
    if (error){
        alert(error)
        location.href = "/"
    }
})