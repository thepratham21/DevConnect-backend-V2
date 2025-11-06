# DevConnect APIs

## authRouter
- POST /signup
- POST /login
- POST /logout

## profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /profile/password

## connectionRequestRouter
- POST /request/send/:status/:userID
- POST /request/review/accepted/:requestID
- POST /request/review/rejected/:requestID

## userRouter
- GET /user/requests/received
- GET /user/requests/rejected
- GET /user/feed - Gets you the profiles of other users on platform



Status: ignore, interested, accepted, rejected

- /feed - api
- User should see all the user cards except
1. his own cards.
2. his connections.
3. ignored people
4. already sent the connection request