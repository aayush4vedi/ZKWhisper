# [client]

* [x] basic UI for create wallet page and placeholder for login and recover page
* [x] write logic for creating wallet(address) from given mnemonic.

# =========================== get an answer to this before moving ahead?
* [x] [!Q!] From tornado-cash(my primer)'s implementation it looks like the circuits are just to compute hashes on client side. How is this better than just using a hash function in client???


# [circuit:user-auth]
* [] write circuit for create user-auth-merkle tree (similar to tornado)- address(?) + password
* [] integrate this circuit with frontend

# [solidity]
* [] write contract for login and store this merkle proof in on-chain tree

# [client]
* [] complete user login flow.

...


