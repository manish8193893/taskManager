import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout';
import ProfilePhotosSelector from '../../components/Inputs/ProfilePhotosSelector';
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import uploadImage from '../../utils/uploadImage';

const SignUp = () => {
    const [profilePic, setProfilePic] = useState(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [adminInviteToken, setAdminInviteToken] = useState("");
    const [error, setError] = useState(null);

    const { updateUser } = useContext(UserContext);
    const navigate = useNavigate();

    // Handle Sign Up form Submit
    const handleSignUp = async (e) => {
        e.preventDefault();

        let profileImageUrl = "";
        if (!fullName) {
            setError("Please enter your name")
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.")
            return;
        }

        if (!password) {
            setError("Please enter your password");
            return;
        }

        setError("");

        // SignUp API Call

        try {

            // upload image
            if (profilePic) {
                const imgUpLoadRes = await uploadImage(profilePic);
                profileImageUrl = imgUpLoadRes.imageUrl || "";
            }


            const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
                name: fullName,
                email,
                password,
                profileImageUrl,
                adminInviteToken
            });

            const { token, role } = response.data;

            if (token) {
                localStorage.setItem("token", token);
                // Pass full response data (which contains token and user info) to updateUser
                updateUser(response.data);
                // Redirect based on role
                if (role === "admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/user/dashboard");
                }
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again later.");
            }
        }
    }

    return (
        <AuthLayout>
            <div className='lg:w-full h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center'>
                <h3 className='text-xl font-semibold text-black'>Create an Account</h3>
                <p className='text-xs text-slate-700 mt-[5px] mb-6'>
                    Join us today by entering your details below.
                </p>

                <form onSubmit={handleSignUp}>

                    <ProfilePhotosSelector image={profilePic} setImage={setProfilePic} />

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Input
                            value={fullName}
                            onChange={({ target }) => setFullName(target.value)}
                            label="Full Name"
                            placeholder="John Doe"
                            type="text"
                        />

                        <Input
                            value={email}
                            onChange={({ target }) => setEmail(target.value)}
                            label="Email Address"
                            placeholder="john@gmail.com"
                            type="text"
                        />


                        <Input
                            value={password}
                            onChange={({ target }) => setPassword(target.value)}
                            label="Password"
                            placeholder="Min 8 Characters"
                            type="password"
                        />

                        <Input
                            value={adminInviteToken}
                            onChange={({ target }) => setAdminInviteToken(target.value)}
                            label="Admin Invite Token"
                            placeholder="7 Digit Code"
                            type="text"
                        />

                    </div>
                    {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

                    <button type='submit' className='btn-primary'>
                        SIGN UP
                    </button>

                    <p className='text-[13px] text-slate-800 mt-3'>
                        Already have an account?{" "}
                        <Link className='font-medium text-primary underline' to="/login">
                            Login
                        </Link>
                    </p>
                </form>
            </div>
        </AuthLayout>
    )
}

export default SignUp
