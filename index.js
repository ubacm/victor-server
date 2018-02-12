const fetch = require('node-fetch')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 8080

app.use(bodyParser.urlencoded({ extended: false }))

app.post('/checkin', function (req, res) {
  const token = req.body.token
  const user = req.body.user_id
  const code = req.body.text

  fetch('https://chicken-ubacm.herokuapp.com/checkin', {
    method: "POST",
    headers: {
      'api_key': token,
      'slack_id': user,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'check_in_code': code,
    })
  }).then((e) => e.json())
  .then((json) => { 
    res.send(json.message)
  })
})

app.post('/event', function (req, res) {
  const token = req.body.token
  const user = req.body.user_id
  const parts = req.body.text.split(' ')
  const command = parts[0]
  const code = parts[1]
  switch (command) {
    case 'new':
      let name = parts.slice(1).join(' ')
      let weight = 1
      if (!isNaN(parts[1])) {
        name = parts.slice(2).join(' ')
        weight = parts[1]
      }

      if (!name) {
        res.send('Usage: /event new <optionalWeight> <name>')
      } else {
        createEvent(name, weight, token, user, res)
      }
      break
    case 'list':
      listEvents(false, token, user, res)
      break
    case 'active':
      listEvents(true, token, user, res)
      break
    case 'close':
      if (!code) {
        res.send('Usage: /event close <eventCode>')
      }
      setEventStatus('close', code, token, user, res)
      break
    case 'reopen':
      if (!code) {
        res.send('Usage: /event close <eventCode>')
      }
      setEventStatus('reopen', code, token, user, res)
      break
    case 'delete':
      if (!code) {
        res.send('Usage: /event close <eventCode>')
      }
      setEventStatus('delete', code, token, user, res)
      break
    case 'reactivate':
      if (!code) {
        res.send('Usage: /event close <eventCode>')
      }
      setEventStatus('reactivate', code, token, user, res)
      break
  }
})

function createEvent(name, weight, token, user, res) {
  fetch('https://chicken-ubacm.herokuapp.com/event/new', {
    method: "POST",
    headers: {
      'api_key': token,
      'slack_id': user,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'name': name,
      'weight': Number(weight),
    })
  }).then((e) => e.json())
  .then((json) => { 
    // Had error
    if (json.message) {
      res.send(json.message)
    } else {
      res.send('Event #' + json.event_id + ' was created. Check-in code is ' + json.check_in_code)
    }
  })
}

function listEvents(active, token, user, res) {
  fetch('https://chicken-ubacm.herokuapp.com/event/list' + (active ? '/active' : ''), {
    headers: {
      'api_key': token,
      'slack_id': user,
      'Content-Type': 'application/json',
    },
  }).then((e) => e.json())
  .then((json) => { 
    // Had error
    if (json.message) {
      res.send(json.message)
    } else {
      res.send('*Here\'s all of the events: *\n' + json.events.reduce((fin, item) => {
        const statusEmoji = (item.deleted ? ':trash: ' : (item.active ? ':heavy_check_mark: ' : ':x: ' ))
        return fin += (statusEmoji + item.name + ' - ' + item.check_in_code + ' - ' + item.attendees.length + '\n')
      }, ''))
    }
  })
}

function setEventStatus(status, code, token, user, res) {
  fetch(('https://chicken-ubacm.herokuapp.com/event/' + status), {
    method: 'PUT',
    headers: {
      'api_key': token,
      'slack_id': user,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'check_in_code': code
    })
  }).then((e) => e.json())
  .then((json) => { 
    res.send(json.message)
  })
}

// start the server
app.listen(port)
console.log('Server started! At http://localhost:' + port)