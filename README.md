# Stream Empires API

## Paths 
### User Paths
```
/users/getall
/user/get
/user/create
/user/update
/user/delete
/user/logout
/user/login
```
#### /users/getall
|  Details   | value         | 
|---         | ------------- |
| Method     | GET           |
| Parameters | None          |
| Privileges | None          |

#### /user/get
|  Details   | value                   | Required |
|---         | ----------------------- | ---      |
| Method     | GET                     | Yes      |
| Parameters | sitename or id          | Yes      |
| Privileges | None                    | N/A      |
---
### Authentication Paths
```
/auth/discord
/auth/twitch
```
