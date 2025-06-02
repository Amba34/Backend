import { Router } from "express";
import { changeCurrentPassword, getcurrentUser, getUserChannalProfile, getWatchHistory, loginUser, logoutUser, refrashAccessToken, registerUser, updateAccount, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
router.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
    ]),
    registerUser
)
router.route("/login").post(loginUser)

// secure routes

router.route("/logout").post(verifyJWT , logoutUser);
router.route("/refreshToken").post(refrashAccessToken);
router.route("/changePassword").post(verifyJWT,changeCurrentPassword);
router.route("/currentUser").get(verifyJWT,getcurrentUser);
router.route("/updateProfile").patch(verifyJWT,updateAccount);
router.route("/update/avater").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/update/coverimage").patch(verifyJWT,upload.single("coverimage"),updateUserCoverImage);
router.route("/c/:username").get(verifyJWT,getUserChannalProfile);
router.route("/history").get(verifyJWT,getWatchHistory);


export default router
