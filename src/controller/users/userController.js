import supabase from '../../config/supabase.js'
import { userSchema, signInSchema } from '../../models/users.js'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import { createToken, createRefreshToken } from '../../middleware/jwt.js'
import { config } from "dotenv";
config({ path: '.env' })

export const getUsers = async (req, res) => {
  try {
    //const { id } = req.params
    const { data: users } = await supabase
      .from('users')
      .select('*')
      //.eq('id', id)

    res.status(200).json({ user: users })
  } catch (err) {
    return res.status(200).json({
      status: 'fail',
      message: `Gagal get User, ${err.message}`
    });
  }
}

export const signUp = async (req, res) => {
    try {
      const { error, value } = await userSchema.validate(req.body, { abortEarly: false })
  
      if (error) {
        const response = res.status(400).json({
          status: 'fail',
          message: `${error.message}`
        })
        return response
      };
  
      const { email, username, password, confirmPassword } = req.body
  
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);
  
      if (existingEmail.length > 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email sudah Terdaftar'
        })
      }
  
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username);
  
      if (existingUser.length > 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Username sudah Terdaftar'
        })
      }
  
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: 'fail',
          message: 'Password dan Confirm Password tidak cocok'
        })
      }
  
      // const { otp, expirationTime } = await generateOtp()
      // const success = await sendMail(email, otp)
  
      // if (!success) {
      //   throw new Error('Register Gagal, Kode verifikasi gagal dikirim');
      // }
      
    //   const imageUrl = await getImageUrl('public', 'user_images', 'pp.jpg')
      const signature = nanoid(4);
      const hashPassword = await bcrypt.hash(password, 10);
  
      const { error: err } = await supabase
        .from('users')
        .insert({ username: username, email: email, password: hashPassword, signature: signature })
        .select()
  
      if (err) {
        return res.status(400).json({
          status: 'fail',
          message: err
        })
      }
  
      const response = res.status(200).json({
        status: 'success',
        message: 'Register Berhasil, Silakan Masuk ke Menu Login',
      })
  
      return response
  
    } catch (err) {
      res.status(500).json({
        status: 'fail',
        message: err.message
      })
    }
  }
  
//   export const verifyOtp = async (req, res) => {
//     try {
//       const { error, value } = otpSchema.validate(req.body, { abortEarly: false });
  
//       if (error) {
//         const response = res.status(400).json({
//           status: 'fail',
//           message: `Verifikasi Gagal, ${error.message}`
//         })
//         return response
//       };
  
//       const { email, otp } = req.body;
  
//       const user = store.get('data')
  
//       if (!user) {
//         const response = res.status(400).json({
//           status: 'fail',
//           message: 'Verifikasi Gagal, data tidak ada',
//         });
//         return response
//       }
  
//       //if email doesn't exist
//       if (user.email !== email) {
//         const response = res.status(400).json({
//           status: 'fail',
//           message: 'Verifikasi Gagal, Email tidak ditemukan',
//         });
//         return response
//       }
  
//       //if otp code wrong
//       if (user.otp !== otp) {
//         const response = res.status(400).json({
//           status: 'fail',
//           message: 'Verifikasi Gagal, Kode OTP Salah',
//         });
//         return response
//       }
  
//       const date = Date.now()
  
//       //if otp code was expired
//       if (user.expirationTime < date) {
//         const response = res.status(400).json({
//           status: 'fail',
//           message: 'Verifikasi Gagal, Kode OTP Kadaluarsa',
//         });
//         return response
//       }
  
//       //if success
//       const { error: err } = await supabase
//         .from('users')
//         .insert({ username: user.username, email: user.email, password: user.password, first_name: user.firstName, last_name: user.lastName, signature: user.signature, status: true })
//         .select()
  
//       if (err) {
//         const response = res.status(400).json({
//           status: 'fail',
//           message: 'Verifikasi Gagal',
//         });
//         return response
//       }
  
//       const response = res.status(200).json({
//         status: 'success',
//         message: 'Verifikasi Berhasil, Silakkan masuk ke Menu Login',
//       });
//       return response
  
//     } catch (err) {
//       res.status(500).json({
//         status: 'fail',
//         message: err.message
//       })
//     }
//   }
  
export const signIn = async (req, res) => {
  try {
      const { username, email, password } = req.body;

      const { error, value } = signInSchema.validate(req.body, { abortEarly: true });

      if (error) {
          return res.status(400).json({
              status: 'fail',
              message: `Login Gagal, ${error.message}`
          });
      }

      const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq.${username},email.eq.${email}`);

      if (userError) {
          throw new Error(userError.message);
      }

      if (!users || users.length === 0) {
          return res.status(404).json({
              status: 'fail',
              message: 'Silakan Masukkan Email atau username yang benar'
          });
      }

      const user = users[0];

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
          return res.status(401).json({
              status: 'fail',
              message: 'Silakan Masukkan Password yang benar'
          });
      }

      // let roleType = 'user';
      // if (user.role === 1) {
      //     roleType = 'free user';
      // } else if (user.role === 2) {
      //     roleType = 'premium user';
      // }

      const { accessToken } = createToken({ id: user.id, username: user.username, email: user.email });

      res.status(200).json({
          accessToken,
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
      });

  } catch (err) {
      res.status(500).json({
          status: 'fail',
          message: err.message
      });
  }
};

  
  export const logOut = async (req, res) => {
    try {
  
      const { refreshToken } = req.cookies;
  
      if (!refreshToken) return res.status(204);
  
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('refresh_token', refreshToken);
  
      if (!token[0]) return res.status(204);
  
      await supabase
        .from('users')
        .update({ refresh_token: null })
        .eq('id', user[0].id)
  
      res.clearCookie('refreshToken')
  
      return res.status(200).json({
        status: 'success',
        message: 'Berhasil Logout'
      });
  
    } catch (err) {
      return res.status(200).json({
        status: 'fail',
        message: `Gagal Logout, ${err.message}`
      });
    }
  
  }

  export const changeUserRole = async (req, res) => {
    try {
      const id = req.params.id; // Mendapatkan id dari req.params
  
      // Perbarui peran (role) pengguna
      const { error } = await supabase
        .from('users')
        .update({ role: 2 }) // Mengubah peran menjadi 2
        .eq('id', id);
  
      if (error) {
        return res.status(500).json({
          status: 'fail',
          message: 'Gagal mengubah peran pengguna.'
        });
      }
  
      return res.status(200).json({
        status: 'success',
        message: 'Peran pengguna berhasil diubah.'
      });
  
    } catch (err) {
      return res.status(500).json({
        status: 'fail',
        message: 'Terjadi kesalahan dalam mengubah peran pengguna.',
        error: err.message
      });
    }
  };