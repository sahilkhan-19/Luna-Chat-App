import {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'

const ProfilePage = () => {

  const {authUser, updateProfile} = useContext(AuthContext);

  const [selectedImage, setSelectedImage] = useState(null)
  const navigate = useNavigate();
  const [name, setName] = useState(authUser?.name ?? '')
  const [bio, setBio] = useState(authUser?.bio ?? '')

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if(!selectedImage) {
      await updateProfile({name, bio});
      navigate("/")
      return;
    }
    const render = new FileReader();
    render.readAsDataURL(selectedImage);
    render.onload = async () => {
      const base64Image = render.result;
      await updateProfile({ profilePic: base64Image, name, bio });
      navigate("/");
    }
  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 bprder-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={onSubmitHandler} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e)=> setSelectedImage(e.target.files[0])} type="file" id="avatar" accept='.png, .jpg, .jpeg' hidden/>
            <img src={selectedImage ? URL.createObjectURL(selectedImage) : assets.avatar_icon} alt="" className={`w-12 h-12 ${selectedImage && 'rounded-full'}`}/>
            upload profile picture
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" required placeholder='your name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'/>
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} required placeholder='your bio' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4}/>
          <button type='submit' className='bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-md cursor-pointer transition-colors duration-300'>Save</button>
        </form>
        <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImage && 'rounded-full'}`} src={authUser?.profilePic || authUser?.profilePicture || assets.logo_icon} alt="" />   
      </div>
    </div>
  )
}

export default ProfilePage