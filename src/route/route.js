const express = require('express');
const { create_user } = require('../controller/user_controller');

const router = express.Router();


router.post('/create_user', create_user)

router.get("/testing", (_req, res)=>{
    return res.status(200).send({status: true, message: "Testing API Live"})
});
router.all("/**", (_req, res)=>{
    return res.status(404).send({status: false, message: "Requested API not available"})
});


module.exports=router;