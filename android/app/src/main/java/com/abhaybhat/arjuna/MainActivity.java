package com.abhaybhat.arjuna;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TaskTimerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
