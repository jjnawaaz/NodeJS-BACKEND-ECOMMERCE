const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModels");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//Register a user
exports.registerUser = catchAsyncErrors( async (req,res,next)=>{
    const {name, email, password} = req.body;
    const  user = await User.create({
        name,email,password,
        avatar: {
            public_id: "This is a sample Id",
            url: "profilepicUrl"
        }
    });

    sendToken(user, 201, res);
});


//Login User

exports.loginUser = catchAsyncErrors (async (req, res, next) => {
    const { email , password } = req.body;
    // checking if user has given email and password both
    if(!email || !password) {
        return next(new ErrorHander("Please Enter Email and Password",400));
    }

    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHander("Invalid Email or Password",401));
    }
    
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHander("Invalid Email or Password",401));
    }

    sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res ,next)=>{
    
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });
    
    res.status(200).json({
        success: true,
        message: "Logged Out Successfully"
    });
})


// Forgot Password 
exports.forgotPassword = catchAsyncErrors( async(req, res, next)=> {
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new ErrorHander("User not found", 404));
    }
    // Get Reset Password Token
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    const resetPassswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
    const message = `Your password reset token is :- \n\n ${resetPassswordUrl} \n\n 
    If you have not requested this email then, please ignore it`
try {
     
    await sendEmail({
        email: user.email,
        subject: `Ecommerce Password Recovery`,
        message,
    });

    res.status(200).json({
        success: true,
        message: `Email sent ot ${user.email} successfully`
    })

} catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({validateBeforeSave: false});

    return next(new ErrorHander(error.message, 500));
}


});

//Reset Password

exports.resetPassword = catchAsyncErrors(async (req, res, next)=>{
   // creating token hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now()},
    });

    if(!user){
        return next(new ErrorHander("Reset Password Token is Invalid or has been expired", 400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHander("Password doesnt match", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);
})

//Get User Details

exports.getUserDetails = catchAsyncErrors(async (req, res, next)=>{
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
})

//Update User Password
exports.updatePassword = catchAsyncErrors(async (req, res, next)=>{
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHander("Old Password is incorrect",400));
    }
    if(req.body.newPassword !== req.body.confirmPassword ){
        return next(new ErrorHander("password doesnt match",400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res);
})

//Update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next)=>{
    
const newUserData = {
    name: req.body.name,
    email: req.body.email
}

// we will add cloudinary later (avatar)

const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
});
    res.status(200).json({
        success: true,
    });
});



//Get all Users

exports.getAllUser = catchAsyncErrors( async( req, res, next)=>{
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    })

})


//Get Single User Details (admin)

exports.getSingleUser = catchAsyncErrors( async( req, res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHander(`User doesnot exist with Id: ${req.params.id}  `));
    }

    res.status(200).json({
        success: true,
        user,
    })

})

//Update User Role -- Admin

exports.updateUserRole = catchAsyncErrors(async (req, res, next)=>{
    
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    if(!user){
        return next(new ErrorHander(`User doesnt exist with id: ${req.params.id}`,400))
    }
        res.status(200).json({
            success: true,
        });
    });

//  Delete User --Admin

    exports.deleteUser = catchAsyncErrors(async (req, res, next)=>{
    
    const user = await User.findById(req.params.id);
    // we will remove cloudinary later (avatar)
    if(!user){
        return next(new ErrorHander(`User doesnt exist with id: ${req.params.id}`,400))
    }

    await user.remove();
    
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    });