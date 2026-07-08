import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import handymanRoutes from './routes/handymen';
import bookingsRoutes from './routes/bookings';
import messagesRoutes from './routes/messages';
import paymentsRoutes from './routes/payments';
import reviewsRoutes from './routes/reviews';
import notificationsRoutes from './routes/notifications';
import couponsRoutes from './routes/coupons';
import adminRoutes from './routes/admin';


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/handymen', handymanRoutes);
app.use('/v1/bookings', bookingsRoutes);
app.use('/v1/messages', messagesRoutes);
app.use('/v1/payments', paymentsRoutes);
app.use('/v1/reviews', reviewsRoutes);
app.use('/v1/notifications', notificationsRoutes);
app.use('/v1/coupons', couponsRoutes);
app.use('/v1/admin', adminRoutes);

// Socket.io Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
    if (err) return next(new Error('Authentication error'));
    socket.data.user = decoded;
    next();
  });
});

// Socket.io Handlers
io.on('connection', (socket) => {
  const userId = socket.data.user.id;
  socket.join(userId);

  socket.on('send_message', async (data) => {
    const { receiverId, content, bookingId } = data;
    try {
      const message = await prisma.message.create({
        data: { senderId: userId, receiverId, content, bookingId }
      });
      // Emit to receiver
      io.to(receiverId).emit('receive_message', message);
      // Emit back to sender
      socket.emit('receive_message', message);

      // Trigger mock push notification to receiver
      io.to(receiverId).emit('new_notification', {
        title: 'New Message',
        body: `New message from User ${userId.substring(0, 4)}.`
      });
    } catch (err) {
      console.error('Socket error:', err);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
