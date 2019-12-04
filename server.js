const express = require('express');
const bcrypt = require('bcrypt-nodejs');
var cors = require('cors');
var bodyParser = require('body-parser');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : '123',
      port: 5434,
      database : 'smartbrain'
    }
});

db.select('*').from('users').then(data => {
    //console.log(data);
});

const app = express();

//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))


app.get('/', (req,res) => {
    //console.log(database.users);
    res.send(db.users);
    //res.send({response: 'server response'});
})

app.get('/profile/:id', (req,res) => {
    const { id } = req.params;
    let found = false;
    console.log(id);
    /*database.users.forEach(user => {
        if (user.id === id) {
            found = true;
            return res.json(user);
        } 
    })*/

    db.select('*').from('users').where({id})
      .then(user => {
        //console.log(user);
        if (user.length) {
            res.json(user[0])
        } else {
            res.status(400).json('not found')
        }
    })
      .catch(err => res.status(400).json('error getting user'))


    /*
    if (!found) {
        res.status(400).json('not found');
    }*/
})

app.put('/image', (req,res) => {
    const { id } = req.body;

    db('users').where('id', '=', id)
    .increment('entries',1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0])
    })
    .catch(err => res.status(400).json('unable to get entries'))


})

app.post('/signin', (req, res) => {
    
    const { email, password} = req.body;
    if (!email||!password) {
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
      .where('email','=', req.body.email)
      .then(data => {
       const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
       //console.log(isValid);
       if (isValid) {
           return db.select('*').from('users')
           .where('email','=', req.body.email)
           .then(user => {
              // console.log(user);
               res.json(user[0])
           })
           .catch(err => res.status(400).json('unable to get user'))
       } else {
         res.status(400).json('wrong credentials')
       }

     })
     .catch(err => res.status(400).json('wrong credentials'))

    
})

app.post('/register', (req,res) => {
    const {email, name, password } = req.body;
    
    bcrypt.hash(password, null, null, function(err, hash) {
        
        db.transaction(trx => {
            return trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                console.log(loginEmail);
                return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0],
                    //email: email,
                    name: name,
                    joined: new Date()
                })
                .then(user => {
                    //console.log(loginEmail[0]);
                    res.json(user[0]);
                })
            })
            
            .then(trx.commit)
            .catch(trx.rollback)        
        })
    })
})


app.listen(3000, () => {
    console.log('app is running');
})

//console.log(process.env);
