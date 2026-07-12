package com.abhaybhat.arjuna;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;

// Keeps a single task timer running while the app is backgrounded/screen-locked.
// Elapsed time is always derived from a stored wall-clock start timestamp, never
// a tick counter — so Doze-delayed Handler callbacks never desync the reported time.
public class TaskTimerForegroundService extends Service {

    public static final String ACTION_START = "com.abhaybhat.arjuna.action.START_TIMER";
    public static final String ACTION_STOP  = "com.abhaybhat.arjuna.action.STOP_TIMER";
    public static final String EXTRA_TASK_ID = "taskId";
    public static final String EXTRA_TITLE   = "title";

    private static final String PREFS = "task_timer_prefs";
    private static final String KEY_RUNNING     = "running";
    private static final String KEY_TASK_ID     = "taskId";
    private static final String KEY_TITLE       = "title";
    private static final String KEY_STARTED_AT  = "startedAtMillis";

    private static final String CHANNEL_ID = "task_timer_channel";
    private static final int NOTIFICATION_ID = 4210;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable ticker;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopTimerInternal();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        String taskId = intent != null ? intent.getStringExtra(EXTRA_TASK_ID) : "";
        String title  = intent != null ? intent.getStringExtra(EXTRA_TITLE) : "Task Timer";
        startTimerInternal(taskId, title);
        return START_STICKY;
    }

    private void startTimerInternal(String taskId, String title) {
        prefs().edit()
            .putBoolean(KEY_RUNNING, true)
            .putString(KEY_TASK_ID, taskId)
            .putString(KEY_TITLE, title)
            .putLong(KEY_STARTED_AT, System.currentTimeMillis())
            .apply();

        createChannelIfNeeded();
        Notification notification = buildNotification(title, 0);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        scheduleTick(title);
    }

    private void scheduleTick(String title) {
        if (ticker != null) handler.removeCallbacks(ticker);
        ticker = new Runnable() {
            @Override
            public void run() {
                if (!prefs().getBoolean(KEY_RUNNING, false)) return;
                long elapsed = getElapsedSeconds(TaskTimerForegroundService.this);
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification(title, elapsed));
                handler.postDelayed(this, 1000);
            }
        };
        handler.postDelayed(ticker, 1000);
    }

    private void stopTimerInternal() {
        if (ticker != null) handler.removeCallbacks(ticker);
        prefs().edit().putBoolean(KEY_RUNNING, false).apply();
    }

    private Notification buildNotification(String title, long elapsedSec) {
        String time = String.format("%02d:%02d:%02d", elapsedSec / 3600, (elapsedSec % 3600) / 60, elapsedSec % 60);
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, 0, contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText("Running — " + time)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setContentIntent(pending)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Task Timer", NotificationManager.IMPORTANCE_LOW);
                channel.setDescription("Shows the currently running task timer");
                nm.createNotificationChannel(channel);
            }
        }
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static boolean isRunning(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_RUNNING, false);
    }

    public static String getRunningTaskId(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_TASK_ID, null);
    }

    public static long getElapsedSeconds(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean(KEY_RUNNING, false)) return 0;
        long startedAt = p.getLong(KEY_STARTED_AT, System.currentTimeMillis());
        return Math.max(0, (System.currentTimeMillis() - startedAt) / 1000);
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
