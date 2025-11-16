const express = require('express');
const { userAuth } = require('../middlewares/auth');
const paymentRouter = express.Router();
const razorpayInstance = require('../utils/razorpay');
const Payment = require('../models/payments');
const { premiumAmount } = require('../utils/constants');


paymentRouter.post('/payment/create', 
    userAuth,
    async (req, res) => {
        try {

            const { firstName, lastName, emailId} = req.user;

            const order = await razorpayInstance.orders.create({
                amount: premiumAmount,
                currency: "INR",
                receipt: "receipt#1",
                
                notes: {
                    firstName,
                    lastName,
                    emailId,
                    typeofPlan: "Premium"
                    
                },
            });

            //save order details in my database
            const paymentRecord = new Payment({
                userId: req.user._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                notes: order.notes,
                status: order.status,
            });

            // Save the payment record to the database
            
            const savedPayment = await paymentRecord.save();

            
            

            //return order details to frontend
            return res.status(201).json({...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID  });
        } 
        
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create order' });
        }
    }
);




module.exports = paymentRouter;


