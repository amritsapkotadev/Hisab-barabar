import admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.log('Firebase admin initialization error', error)
  }
}

export const firebaseAdmin = admin

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        ...data
      },
      token: fcmToken,
      android: {
        priority: 'high' as 'high',
        notification: {
          channelId: 'high_alerts',
          sound: 'default',
          priority: 'high' as 'high',
          defaultVibrateTimings: true,
          visibility: 'public' as 'public',
        },
        ttl: 86400, // 24 hours time-to-live
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
          },
        },
      },
    }

    const response = await admin.messaging().send(message)
    console.log('Successfully sent message:', response)
    return response
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}
