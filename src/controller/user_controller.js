const bcrypt = require('bcrypt');

// exports.create_user = async (req, res) => {
//     try {
//       const db = req.con;
//       const data = req.body;
//       const { full_name, mobile_number, email_id, password, address } = data;
//       const hash_password = bcrypt.hashSync(password, 10);
  
//       // Create table if not exists
//       await new Promise((resolve, reject) => {
//         db.query(
//           `CREATE TABLE IF NOT EXISTS customer (id INT AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(255), mobile_number VARCHAR(255), email_id VARCHAR(255), password VARCHAR(255), address VARCHAR(255))`,
//           (err, result) => {
//             if (err) {
//               console.error('Error creating the table:', err.stack);
//               reject(err);
//             } else {
//               console.log('Table created successfully!');
//               resolve(result);
//             }
//           } 
//         );
//       });
        
//       // Insert user data
//       await new Promise((resolve, reject) => {
//         db.query(
//           'INSERT INTO customer (full_name, mobile_number, email_id, password, address) VALUES (?, ?, ?, ?, ?)',
//           [full_name, mobile_number, email_id, hash_password, address],
//           (error, result) => {
//             if (error) {
//               reject(error);
//             } else {
//               const { password, ...responseData } = data;
//               res.status(200).send({ status: true, message: 'User Registered Successfully', data: responseData });
//               resolve();
//             }
//           }
//         );
//       });
//     } catch (error) {
//       res.status(500).send({ status: false, message: error.message });
//     }
//   };
  
exports.create_user = async (req, res) => {
  try {
    const db = req.con;

    // Create table if not exists 
    await db.query(
      `CREATE TABLE IF NOT EXISTS customer (id INT AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(255), mobile_number VARCHAR(255),
        email_id VARCHAR(255), password VARCHAR(255), address VARCHAR(255), db_data CHAR(4))`, (error, result)=>{
        if (error){
          console.error('Error creating the table:', error.stack);
        } else if (result.warningCount === 0){
          console.log('Table created successfully!');
        }
      });
      
    const field_allowed = ["full_name", "mobile_number", "email_id", "password", "address"];
    const data = req.body;
    const received_key = field_allowed.filter(x => !Object.keys(data).includes(x));
    if(Object.keys(data).length === 0 ){
      return res.status(400).send({ status: true, message: `Nothing in body to proceed`});
    }
    if(received_key.length){
      return res.status(400).send({ status: true, message: `${received_key} field missing`});
    }

    const { full_name, mobile_number, email_id, password, address} = data;

    if(!full_name.trim()) return res.status(400).send({status:false, message: "Full Name is Can'not be blank"});
    if(!(/^[A-Z a-z]{1,29}$/.test(full_name.trim()))) return res.status(400).send({status:false, message: "Full should be in alphabet only"});
  
    if(!mobile_number) return res.status(400).send({ status: false, message: `Mobile cannot be blank` });
    if (!/^[6789]\d{9}$/.test(mobile_number)) return res.status(400).send({status: false,msg: `${mobile_number} is not a valid mobile number, Please enter 10 digit mobile number`});
  
    if(!email_id.trim()) return res.status(400).send({ status: false, message: `Email cannot be blank` });
    if (!(/^\s*[a-zA-Z][a-zA-Z0-9]*([-\.\_\+][a-zA-Z0-9]+)*\@[a-zA-Z]+(\.[a-zAZ]{2,5})+\s*$/.test(email_id))) return res.status(400).send({status: false,message: `${email_id} should be a valid email address`});

    if(!password.trim()) return res.status(400).send({status:false, message: "Password is required"});
    if(!(/^\s*(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,15}\s*$/.test(password.trim()))) return res.status(400).send({status:false, message: "Pasword Should be in Alphanumeric and special character and length 8-15 digit only"});

    await db.query('select email_id, mobile_number from customer where email_id=? or mobile_number=?', [email_id, mobile_number], (error, result)=>{
      if(error){
        return res.status(400).send({ status: false, message: error.message });
      }
      if(result.length > 0){
        const existing_mobile= result.find(user => user.mobile_number === String(mobile_number));
        const existing_email= result.find(user => user.email_id === email_id);

        if(existing_mobile){
          return res.status(400).send({success : false, message: `User already exists with this ${mobile_number}`});
        }        
        if(existing_email){
          return res.status(400).send({success : false, message: `User already exists with this ${email_id}`});
        }
        
      }
    
    const hash_password = bcrypt.hashSync(password, 10);

    const generate_random_db = () =>{
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = "";
      for (let i=0;i<4;++i){
         const random_index = Math.floor(Math.random() * alphabet.length);
         const random_letter = alphabet.charAt(random_index);
         result += random_letter; 
       }
       return result
    }
    const random_alphabet = generate_random_db();

    // Insert user data
    db.query(
      'INSERT INTO customer (full_name, mobile_number, email_id, password, address, db_data) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, mobile_number, email_id, hash_password, address, random_alphabet], (error) => {
        if (error){  
          return res.status(400).send({ status: false, message: error.message });
        } else {
          const { password, ...responseData } = data;
          responseData.db_data = random_alphabet;

          db.query(`CREATE DATABASE IF NOT EXISTS ${random_alphabet}`, (err) => {
            if (err) {
              console.error('Error creating the database:', err.stack);
            } else {
              console.log(`${random_alphabet} Database created successfully!`);

              db.query(`use ${random_alphabet}`, (error)=>{
                if(error){
                  console.error('Error selecting the database:', err.stack);
                  return res.status(400).send({ status: false, message: error.message});
                  }else{
                  console.log("Successfully connected to "+`${random_alphabet}`);

                  db.query(`CREATE TABLE IF NOT EXISTS ${random_alphabet}_master(id INT AUTO_INCREMENT PRIMARY KEY,
                  email_id VARCHAR(255), password VARCHAR(255), role VARCHAR(255) default 'user', email_verified ENUM('YES', 'NO') default 'NO',
                  mobile_verified ENUM('YES', 'NO') default 'NO')`, (error) =>{
                  if(error){
                    console.error('Error creating the master table:', err.stack);
                    return res.status(400).send({ status: false, message: error.message });
                  } else {
                    console.log(`${random_alphabet}_master table created successfully`);

                    db.query(`insert into ${random_alphabet}_master (email_id, password) values (?, ?)`, [email_id, hash_password], (error)=>{
                      if(error){
                        return res.status(400).send({ status: false, message: error.message });
                      } else {
                        return res.status(200).send({ status: true, message: 'User Registered Successfully', data: responseData});
                      }
                    })
                  }
                })
              }
            })
          }
        }) 
        }
      });
    });

  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};
