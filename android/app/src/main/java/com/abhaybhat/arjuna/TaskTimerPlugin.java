package com.abhaybhat.arjuna;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TaskTimer")
public class TaskTimerPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String taskId = call.getString("taskId", "");
        String title = call.getString("title", "Task Timer");

        Intent intent = new Intent(getContext(), TaskTimerForegroundService.class);
        intent.setAction(TaskTimerForegroundService.ACTION_START);
        intent.putExtra(TaskTimerForegroundService.EXTRA_TASK_ID, taskId);
        intent.putExtra(TaskTimerForegroundService.EXTRA_TITLE, title);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), TaskTimerForegroundService.class);
        intent.setAction(TaskTimerForegroundService.ACTION_STOP);
        getContext().startService(intent);
        JSObject ret = new JSObject();
        ret.put("elapsedSec", TaskTimerForegroundService.getElapsedSeconds(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void getElapsed(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", TaskTimerForegroundService.isRunning(getContext()));
        ret.put("taskId", TaskTimerForegroundService.getRunningTaskId(getContext()));
        ret.put("elapsedSec", TaskTimerForegroundService.getElapsedSeconds(getContext()));
        call.resolve(ret);
    }
}
