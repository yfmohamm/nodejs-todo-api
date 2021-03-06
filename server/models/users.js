const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');



var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true,
        validate: {
            // validator = (value)=> {
            //     return validator.isEmail(value);
            // } OR,
            validator: validator.isEmail, //another usage beside to the above
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
            type: String,
            required: true,
            minlength: 6
    },
    tokens: [{
            access: {
                type: String,
                required: true
            },
            token: {
                type: String,
                required: true
            }
        }]
});

UserSchema.methods.toJSON = function () {
    var user = this;
    var userObject = user.toObject();
    return _.pick(userObject, ['_id','email']);
};

UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access}, 'secret').toString();

    user.tokens.push({access, token});

    return user.save().then(()=> {
        return token;
    });
};

UserSchema.methods.removeToken = function (token) {
    var user = this;
    return user.update({
        $pull: {
            tokens: { token }
        }
    });
}

UserSchema.statics.findByToken = function (token) {
    var user = this;
    var decoded;

    try {
        decoded = jwt.verify(token, 'secret');
    } catch (error) {
        // return new Promise((resolve, reject) => {
        //     reject();
        // });
        return Promise.reject();
    }

    return Users.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
    
};

UserSchema.pre('save', function (next) {
    var user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt)=>{
            bcrypt.hash(user.password, salt, (err, hash)=>{
                user.password = hash;
                next();
            });
        
        });
    } else {
        //if not modified
        next();
    }

});

UserSchema.statics.findByCreds = function (email, password) {
    var User = this;
    User.find
    
}

var Users = mongoose.model('Users', UserSchema);

module.exports = {Users};