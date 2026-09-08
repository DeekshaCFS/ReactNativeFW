package com.corefield.fieldweb.FieldWeb.Admin;

import static com.facebook.FacebookSdk.getApplicationContext;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.Dialog;
import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.SearchView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.applandeo.materialcalendarview.CalendarView;
import com.applandeo.materialcalendarview.EventDay;
import com.applandeo.materialcalendarview.listeners.OnCalendarPageChangeListener;
import com.applandeo.materialcalendarview.listeners.OnDayClickListener;
import com.corefield.fieldweb.Adapter.DatesListAdapter;
import com.corefield.fieldweb.Adapter.UsedItemInventoryAdapter;
import com.corefield.fieldweb.AsyncManager.OnTaskCompleteListener;
import com.corefield.fieldweb.BuildConfig;
import com.corefield.fieldweb.DTO.Attendance.OwnDateAttendance;
import com.corefield.fieldweb.DTO.Attendance.TechMonthlyAttendance;
import com.corefield.fieldweb.DTO.DatesDto;
import com.corefield.fieldweb.DTO.Item.GetUsedItemList;
import com.corefield.fieldweb.DTO.Item.TechWiseItemList;
import com.corefield.fieldweb.DTO.User.UsersList;
import com.corefield.fieldweb.FieldWeb.BaseActivity;
import com.corefield.fieldweb.FieldWeb.Dialogs.ServiceDialog;
import com.corefield.fieldweb.FieldWeb.HomeActivityNew;
import com.corefield.fieldweb.Listener.RecyclerTouchListener;
import com.corefield.fieldweb.Network.URLConnectionResponse;
import com.corefield.fieldweb.R;
import com.corefield.fieldweb.Retrofit.RetrofitClient;
import com.corefield.fieldweb.Util.Connectivity;
import com.corefield.fieldweb.Util.Constant;
import com.corefield.fieldweb.Util.DateUtils;
import com.corefield.fieldweb.Util.FWLogger;
import com.corefield.fieldweb.Util.FirebaseGoogleAnalytics;
import com.corefield.fieldweb.Util.SharedPrefManager;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.gson.Gson;
import com.squareup.picasso.Callback;
import com.squareup.picasso.MemoryPolicy;
import com.squareup.picasso.NetworkPolicy;
import com.squareup.picasso.Picasso;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Response;

/**
 * Fragment Controller for OwnerAttendanceFragment
 *
 * @author CoreField
 * @version 1.1
 * @implNote This Fragment class is used to show attendance of all its technician for particular date (Owner login)
 */
public class UsedItemInventoryFragment extends Fragment implements OnTaskCompleteListener, RecyclerTouchListener, View.OnClickListener, DatePickerDialog.OnDateSetListener {

    protected static String TAG = UsedItemInventoryFragment.class.getSimpleName();
    public OwnDateAttendance.ResultData mOwnerAttend = null;
    private View mRootView;
    private TextView mTextViewAbsent, mTextViewPresent, mTextViewIdle;

    private RecyclerView mRecyclerViewTechList;
    private RecyclerView.LayoutManager mLayoutManager;
    private List<UsersList.ResultData> mUsersLists = null;
    private List<GetUsedItemList.ResultData> mUsedItemList = null;
    private List<TechWiseItemList.ResultData> mTechWistItemList = null;
    private UsedItemInventoryAdapter mUsedItemInventoryAdapter;
    private SearchView mSearchView;
    private DatesListAdapter mDatesListAdapter;
    public String mDate;
    private CalendarView mCalendarView;
    private List<EventDay> mEvents;
    public List<TechMonthlyAttendance.ResultData> mTechAttend = null;
    private UsersList.ResultData mResultData;
    private GetUsedItemList.ResultData mTechResultData;
    private Calendar mCal;
    public int mYear, mMonth, mDay;
    String currentMonthName = "";
    private int mSelectMonth, mSelectedYear;
    Calendar mCalendar;
    TextView txtDate, txtCheckIn, txtCheckOut, txtDayname;
    RelativeLayout curvLayoutAbsent, curvLayoutPresent, curvLayoutIdle;
    TextView txtStatusAbsent, txtStatusPresent, txtStatusIdle;
    TextView txtAbsent, txtPresent, txtIdle, itemLabel, labelTotalqty, txtTotalIssuedItemPrice;
    int presentCount = 0, absentCount = 0, idleCount = 0, itemId;
    int count = 0;
    String purchasePrice = "";
    RecyclerTouchListener recyclerTouchListener;
    private int tSum = 0;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        mRootView = inflater.inflate(R.layout.useditem_inventory_details, container, false);
        //((HomeActivityNew) getActivity()).mRelativeHeaderLayout.setVisibility(View.VISIBLE);

        mCal = Calendar.getInstance();
        mYear = mCal.get(Calendar.YEAR);
        mMonth = mCal.get(Calendar.MONTH);
        mDay = mCal.get(Calendar.DAY_OF_MONTH);

        currentMonthName = DateUtils.getMonthName(mMonth);


        //NOTE: Log GA event
        Bundle bundle = new Bundle();
        bundle.putInt(FirebaseGoogleAnalytics.Param.USER_ID, SharedPrefManager.getInstance(getContext()).getUserId());
        bundle.putString(FirebaseGoogleAnalytics.Param.VERSION_NAME, BuildConfig.VERSION_NAME);
        bundle.putString(FirebaseGoogleAnalytics.Param.USER_TYPE, SharedPrefManager.getInstance(getContext()).getUserGroup());
        bundle.putString(FirebaseGoogleAnalytics.Param.TIME_STAMP, DateUtils.getDateForWithGAFormat());
        bundle.putString(FirebaseGoogleAnalytics.Param.PLATFORM, FirebaseGoogleAnalytics.Defaults.PLATFORM_ANDROID);
        FirebaseAnalytics.getInstance(getContext()).logEvent(FirebaseGoogleAnalytics.Event.OWNER_ATTENDANCE, bundle);
        inIt();
        //manageBackPress();
        return mRootView;
    }

    private void inIt() {
        mTextViewPresent = mRootView.findViewById(R.id.Text_Present);
        mTextViewAbsent = mRootView.findViewById(R.id.Text_Absent);
        mTextViewIdle = mRootView.findViewById(R.id.Text_Idle);
        mRecyclerViewTechList = mRootView.findViewById(R.id.recycler_tech_list);
        txtTotalIssuedItemPrice = mRootView.findViewById(R.id.txtTotalIssuedItemPrice);

        itemLabel = mRootView.findViewById(R.id.itemLabel);
        labelTotalqty = mRootView.findViewById(R.id.labelTotalqty);

        recyclerTouchListener = this;

        try {
            Bundle getBundle = this.getArguments();
            if (getBundle != null) {
                itemId = getBundle.getInt("itemId");
                purchasePrice = getBundle.getString("purchasePrice");

               /* if (purchasePrice.isEmpty() || purchasePrice.equalsIgnoreCase(null)) {
                    txtTotalIssuedItemPrice.setText("Total Used Item Price :" + " " + "-NA-");
                } else {
                    txtTotalIssuedItemPrice.setText("Total Used Item Price :" + " " + (purchasePrice));
                }*/
            }
        } catch (Exception ex) {
            ex.getMessage();
        }
        /* mTechWiseAssignItemListAsyncTask = new TechWiseAssignItemListAsyncTask(getContext(), BaseAsyncTask.Priority.LOW, this);
                mTechWiseAssignItemListAsyncTask.execute(itemId, SharedPrefManager.getInstance(getContext()).getUserId());*/

        getUsedItemList(recyclerTouchListener);


      /*  mUsersListAsyncTask = new UsersListAsyncTask(getContext(), BaseAsyncTask.Priority.LOW, this);
        mUsersListAsyncTask.execute(SharedPrefManager.getInstance(getContext()).getUserId());*/

        mEvents = new ArrayList<>();

        setDates();

//        getDatesList(mCal, ((HomeActivityNew) getActivity()).mSelectedMonth, ((HomeActivityNew) getActivity()).mSelectedDate, ((HomeActivityNew) getActivity()).mSpinnerMonthYear.getSelectedItemPosition());

        getDatesList(mCal, mMonth, ((HomeActivityNew) getActivity()).mSelectedDate);
        setGetDate(mDate);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setText(currentMonthName + " " + mYear);

        DatePickerDialog datePickerDialog = new DatePickerDialog(getActivity(), AlertDialog.THEME_HOLO_LIGHT, this, ((HomeActivityNew) getActivity()).currentYear, ((HomeActivityNew) getActivity()).currentMonth, ((HomeActivityNew) getActivity()).currentDay) {
            @Override
            protected void onCreate(Bundle savedInstanceState) {
                super.onCreate(savedInstanceState);
                int day = getContext().getResources().getIdentifier("android:id/day", null, null);
                if (day != 0) {
                    View dayPicker = findViewById(day);
                    if (dayPicker != null) {
                        //Set Day view visibility Off/Gone
                        dayPicker.setVisibility(View.GONE);
                    }
                }
            }
        };
        mCal.add(Calendar.DATE, 0);
        datePickerDialog.getDatePicker().setMaxDate(mCal.getTimeInMillis());
        mCal.add(Calendar.MONTH, -2);
        datePickerDialog.getDatePicker().setMinDate(mCal.getTimeInMillis());

        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                datePickerDialog.show();
            }
        });
//        ((HomeActivityNew) getActivity()).getMonthYearList();

        /*((HomeActivityNew) getActivity()).mSpinnerMonthYear.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                FWLogger.logInfo(TAG, "onItemSelected called : " + position);
                String selectedTaskType = parent.getItemAtPosition(position).toString();
                FWLogger.logInfo(TAG, "selectedTaskType called : " + selectedTaskType);
                ((HomeActivityNew) getActivity()).mSelectedMonth = ((HomeActivityNew) getActivity()).monthList.get(position);
                FWLogger.logInfo(TAG, "Month Number : " + ((HomeActivityNew) getActivity()).mSelectedMonth);
                getDatesList(mCal, ((HomeActivityNew) getActivity()).mSelectedMonth, ((HomeActivityNew) getActivity()).mSelectedDate, position);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });*/
    }

    public void getUsedItemList(RecyclerTouchListener recyclerTouchListener) {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                int userID = SharedPrefManager.getInstance(getApplicationContext()).getUserId();
                Call<GetUsedItemList> call = RetrofitClient.getInstance(getApplicationContext()).getMyApi().getUsedItemList(itemId, userID, "Bearer " + SharedPrefManager.getInstance(getActivity()).getUserToken());
                call.enqueue(new retrofit2.Callback<GetUsedItemList>() {
                    @Override
                    public void onResponse(Call<GetUsedItemList> call, Response<GetUsedItemList> response) {
                        try {
                            if (response.code() == 200) {
                                FWLogger.logInfo(TAG, "TECH WISE ITEM List added Successfully");
                                GetUsedItemList mList = response.body();
                                mUsedItemList = new ArrayList<>();
                                mUsedItemList = mList.getResultData();
                                try {
                                    int sumQty = 0;
                                    List<Integer> listsum = new ArrayList<>();
                                    for (int i = 0; i < mUsedItemList.size(); i++) {
                                        itemLabel.setText(mUsedItemList.get(i).getItemName());
                                        listsum.add(mUsedItemList.get(i).getUsedQty());
                                        sumQty += listsum.get(i);
                                    }
                                    tSum = sumQty;
                                    labelTotalqty.setText(String.valueOf(sumQty));

                                } catch (Exception e) {
                                    e.getMessage();
                                }

                                try {
                                    if (purchasePrice.isEmpty() || purchasePrice.equalsIgnoreCase(null)) {
                                        txtTotalIssuedItemPrice.setText("Total Used Item Price :" + " " + "-NA-");
                                    } else {
                                        double tup = tSum * Double.parseDouble(purchasePrice);
                                        txtTotalIssuedItemPrice.setText("Total Used Item Price :" + " " + String.valueOf(tup));
                                    }
                                } catch (Exception ex) {
                                    ex.getMessage();
                                }
                                mLayoutManager = new LinearLayoutManager(getActivity());
                                mRecyclerViewTechList.setLayoutManager(mLayoutManager);
                                mUsedItemInventoryAdapter = new UsedItemInventoryAdapter(getActivity(), mUsedItemList);
                                mUsedItemInventoryAdapter.setClickListener(recyclerTouchListener);
                                mRecyclerViewTechList.setAdapter(mUsedItemInventoryAdapter);

                                setSearchFilter();
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<GetUsedItemList> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAllAssignedItemList? API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAllAssignedItemList? API:");
            ex.getMessage();
        }
    }

    public void setDates() {
//        mDate = ((HomeActivityNew) getActivity()).mSelectedYear + "-" + ((HomeActivityNew) getActivity()).mSelectedMonth + "-" + ((HomeActivityNew) getActivity()).mSelectedDate;
        int monthCount = mMonth + 1;
        mDate = mYear + "-" + monthCount + "-" + ((HomeActivityNew) getActivity()).mSelectedDate;
//        FWLogger.logInfo(TAG, "DATE : " + mDate);
    }

    public void getTechAttendance(int userId, CalendarView calendarView) {
//        FWLogger.logInfo(TAG, "TECH_mDate : "+mDate);
        mCalendarView = calendarView;
       /* mTechAttendanceAsyncTask = new TechAttendanceAsyncTask(getContext(), BaseAsyncTask.Priority.LOW, this);
        mTechAttendanceAsyncTask.execute(mDate, userId);*/

        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                //int userID = SharedPrefManager.getInstance(getContext()).getUserId();
                Call<TechMonthlyAttendance> call = RetrofitClient.getInstance(getContext()).getMyApi().getTechAttendance(userId, mDate);
                call.enqueue(new retrofit2.Callback<TechMonthlyAttendance>() {
                    @Override
                    public void onResponse(Call<TechMonthlyAttendance> call, Response<TechMonthlyAttendance> response) {
                        try {
                            if (response.code() == 200) {
                                TechMonthlyAttendance techMonthlyAttendance = response.body();
                                mTechAttend = techMonthlyAttendance.getResultData();

                                if (mTechAttend != null) {
                                    mEvents = new ArrayList<>();
                                    for (TechMonthlyAttendance.ResultData resultData : mTechAttend) {
                                        if (resultData.getAttendance().equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.present, getContext()))) {
                                            FWLogger.logInfo(TAG, "Present");
                                            presentCount++;
                                            String Date1 = resultData.getDate();
                                            FWLogger.logInfo(TAG, Date1);
                                            Date present = null;
                                            try {
                                                present = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(Date1);
                                            } catch (ParseException e) {
                                                e.printStackTrace();
                                            }
                                            FWLogger.logInfo(TAG, "calender");
                                            Calendar mPresentDate = Calendar.getInstance();
                                            mPresentDate.setTime(present);
                                            mEvents.add(new EventDay(mPresentDate, R.drawable.marker_calendar_present));
                                            FWLogger.logInfo(TAG, "calender finish");
                                        } else if (resultData.getAttendance().equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.absent, getContext()))) {
                                            FWLogger.logInfo(TAG, "Absent");
                                            absentCount++;
                                            String Date1 = resultData.getDate();
                                            Date absent = null;
                                            try {
                                                absent = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(Date1);
                                            } catch (ParseException e) {
                                                e.printStackTrace();
                                            }
                                            Calendar mAbsentDate = Calendar.getInstance();
                                            mAbsentDate.setTime(absent);
                                            mEvents.add(new EventDay(mAbsentDate, R.drawable.marker_calendar_absent));
                                        } else if (resultData.getAttendance().equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.idle, getContext()))) {
                                            FWLogger.logInfo(TAG, "Idle");
                                            idleCount++;
                                            String Date1 = resultData.getDate();
                                            Date idle = null;
                                            try {
                                                idle = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(Date1);
                                            } catch (ParseException e) {
                                                e.printStackTrace();
                                            }
                                            Calendar mIdleDate = Calendar.getInstance();
                                            mIdleDate.setTime(idle);
                                            mEvents.add(new EventDay(mIdleDate, R.drawable.marker_calendar_idle));
                                        }
                                    }
                                    FWLogger.logInfo(TAG, techMonthlyAttendance.getMessage());
                                    Calendar min = Calendar.getInstance();
                                    min.set(Calendar.DATE, -60);
                                    Calendar max = Calendar.getInstance();

                                    FWLogger.logInfo(TAG, "Min Date : " + min.getTime() + " Max Date : " + max.getTime());
//                CalendarUtils.getDatesRange(min, max);
                                    try {
                                        mCalendarView.setMinimumDate(min);
                                        mCalendarView.setMaximumDate(max);
                                        mCalendarView.setEvents(mEvents);
                                    } catch (Exception e) {
                                        e.getMessage();
                                    }
                                    setTodaysCheckInCheckOut();
                                    setAttedanceCount();
                                } else {
                                    Toast.makeText(getActivity(), "Error Occurred", Toast.LENGTH_SHORT).show();
                                }

                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<TechMonthlyAttendance> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAttendanceMonthlyForTechnicians API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAttendanceMonthlyForTechnicians API:");
            ex.getMessage();
        }
    }

    public void getDatesList(Calendar cal, int currentMonth, int currentDay) {
        //        cal.set(Calendar.MONTH, currentMonth - 1);
        cal.set(Calendar.MONTH, currentMonth);
        cal.set(Calendar.DAY_OF_MONTH, currentDay);
        int maxDay = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
        FWLogger.logInfo(TAG, "Max Days : " + maxDay);
        SimpleDateFormat df = new SimpleDateFormat("dd");
        if (((HomeActivityNew) getActivity()).mDatesLists != null)
            ((HomeActivityNew) getActivity()).mDatesLists.clear();

        mDatesListAdapter = null;
        ((HomeActivityNew) getActivity()).mDatesLists = new ArrayList<>();
        for (int i = 0; i < maxDay; i++) {
            DatesDto datesDto = new DatesDto();
            cal.set(Calendar.DAY_OF_MONTH, i + 1);
            if (mMonth == ((HomeActivityNew) getActivity()).currentMonth) {  //selectedMonthPos == 0
                if (DateUtils.getCurrentDateOnly() >= i) {
                    datesDto.setDate(Integer.parseInt(df.format(cal.getTime())));
                    datesDto.setDay(new SimpleDateFormat("EE", Locale.ENGLISH).format(cal.getTime()));
                    ((HomeActivityNew) getActivity()).mDatesLists.add(datesDto);
                }
            } else {
                datesDto.setDate(Integer.parseInt(df.format(cal.getTime())));
                datesDto.setDay(new SimpleDateFormat("EE", Locale.ENGLISH).format(cal.getTime()));
                ((HomeActivityNew) getActivity()).mDatesLists.add(datesDto);
            }
        }

        mLayoutManager = new LinearLayoutManager(getContext());
        mLayoutManager = new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false);
        /*((HomeActivityNew) getActivity()).mDatesRecyclerView.setLayoutManager(mLayoutManager);
        mDatesListAdapter = new DatesListAdapter(getContext(), ((HomeActivityNew) getActivity()).mDatesLists, DateUtils.getCurrentDateOnly());
        mDatesListAdapter.setClickListener(this);
        ((HomeActivityNew) getActivity()).mDatesRecyclerView.setAdapter(mDatesListAdapter);
        ((HomeActivityNew) getActivity()).mDatesRecyclerView.scrollToPosition(((HomeActivityNew) getActivity()).mSelectedDate - 1);
        mDatesListAdapter.notifyDataSetChanged();*/
    }


    public void setGetDate(String date) {
        /*mOwnerAttendanceAsyncTask = new OwnerAttendanceAsyncTask(getContext(), BaseAsyncTask.Priority.LOW, this);
        mOwnerAttendanceAsyncTask.execute(SharedPrefManager.getInstance(getContext()).getUserId(), date);*/

        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                Call<OwnDateAttendance> call = RetrofitClient.getInstance(getContext()).getMyApi().getAttendanceMonthlyForAdmin(SharedPrefManager.getInstance(getContext()).getUserId(), date);
                call.enqueue(new retrofit2.Callback<OwnDateAttendance>() {
                    @Override
                    public void onResponse(Call<OwnDateAttendance> call, Response<OwnDateAttendance> response) {
                        try {
                            if (response.code() == 200) {
                                OwnDateAttendance ownDateAttendance = response.body();
            /*mTextViewPresent.setText(String.valueOf(ownDateAttendance.getResultData().getPresentCount()));
            mTextViewAbsent.setText(String.valueOf(ownDateAttendance.getResultData().getAbsentCount()));
            mTextViewIdle.setText(String.valueOf(ownDateAttendance.getResultData().getIdleCount()));*/
                                FWLogger.logInfo(TAG, ownDateAttendance.getResultData().getDate() + " absent" + ownDateAttendance.getResultData().getAbsentCount() + " present" + ownDateAttendance.getResultData().getPresentCount());
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<OwnDateAttendance> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAttendanceMonthlyForAdmin? API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAttendanceMonthlyForAdmin? API:");
            ex.getMessage();
        }
    }

    @Override
    public void onTaskComplete(URLConnectionResponse urlConnectionResponse, String classType) {
        if (classType.equalsIgnoreCase(OwnDateAttendance.class.getSimpleName())) {
            Gson gson = new Gson();
            OwnDateAttendance ownDateAttendance = gson.fromJson(urlConnectionResponse.resultData, OwnDateAttendance.class);
            /*mTextViewPresent.setText(String.valueOf(ownDateAttendance.getResultData().getPresentCount()));
            mTextViewAbsent.setText(String.valueOf(ownDateAttendance.getResultData().getAbsentCount()));
            mTextViewIdle.setText(String.valueOf(ownDateAttendance.getResultData().getIdleCount()));*/
            FWLogger.logInfo(TAG, ownDateAttendance.getResultData().getDate() + " absent" + ownDateAttendance.getResultData().getAbsentCount() + " present" + ownDateAttendance.getResultData().getPresentCount());
        } else if (classType.equalsIgnoreCase(UsersList.class.getSimpleName())) {
            FWLogger.logInfo(TAG, "List added Successfully");
            Gson gson = new Gson();
            mUsersLists = new ArrayList<>();
            UsersList usersList = gson.fromJson(urlConnectionResponse.resultData, UsersList.class);
            mUsersLists = usersList.getResultData();
            mLayoutManager = new LinearLayoutManager(getActivity());
            mRecyclerViewTechList.setLayoutManager(mLayoutManager);
          /*  mItemInventoryAdapter = new ItemInventoryAdapter(getActivity(), mUsersLists);
            mItemInventoryAdapter.setClickListener(this);
            mRecyclerViewTechList.setAdapter(mItemInventoryAdapter);*/

            setSearchFilter();
        } else if (classType.equalsIgnoreCase(TechMonthlyAttendance.class.getSimpleName())) {
            Gson gson = new Gson();
            TechMonthlyAttendance techMonthlyAttendance = gson.fromJson(urlConnectionResponse.resultData, TechMonthlyAttendance.class);

            mTechAttend = techMonthlyAttendance.getResultData();

            if (mTechAttend != null) {
                mEvents = new ArrayList<>();
                for (TechMonthlyAttendance.ResultData resultData : mTechAttend) {
                    if (resultData.getAttendance().equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.present, getContext()))) {
                        FWLogger.logInfo(TAG, "Present");
                        presentCount++;
                        String Date1 = resultData.getDate();
                        FWLogger.logInfo(TAG, Date1);
                        Date present = null;
                        try {
                            present = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(Date1);
                        } catch (ParseException e) {
                            e.printStackTrace();
                        }
                        FWLogger.logInfo(TAG, "calender");
                        Calendar mPresentDate = Calendar.getInstance();
                        mPresentDate.setTime(present);
                        mEvents.add(new EventDay(mPresentDate, R.drawable.marker_calendar_present));
                        FWLogger.logInfo(TAG, "calender finish");
                    } else if (resultData.getAttendance().equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.absent, getContext()))) {
                        FWLogger.logInfo(TAG, "Absent");
                        absentCount++;
                        String Date1 = resultData.getDate();
                        Date absent = null;
                        try {
                            absent = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(Date1);
                        } catch (ParseException e) {
                            e.printStackTrace();
                        }
                        Calendar mAbsentDate = Calendar.getInstance();
                        mAbsentDate.setTime(absent);
                        mEvents.add(new EventDay(mAbsentDate, R.drawable.marker_calendar_absent));
                    } else if (resultData.getAttendance().equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.idle, getContext()))) {
                        FWLogger.logInfo(TAG, "Idle");
                        idleCount++;
                        String Date1 = resultData.getDate();
                        Date idle = null;
                        try {
                            idle = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(Date1);
                        } catch (ParseException e) {
                            e.printStackTrace();
                        }
                        Calendar mIdleDate = Calendar.getInstance();
                        mIdleDate.setTime(idle);
                        mEvents.add(new EventDay(mIdleDate, R.drawable.marker_calendar_idle));
                    }
                }
                FWLogger.logInfo(TAG, techMonthlyAttendance.getMessage());
                Calendar min = Calendar.getInstance();
                min.set(Calendar.DATE, -60);
                Calendar max = Calendar.getInstance();

                FWLogger.logInfo(TAG, "Min Date : " + min.getTime() + " Max Date : " + max.getTime());
//                CalendarUtils.getDatesRange(min, max);
                try {
                    mCalendarView.setMinimumDate(min);
                    mCalendarView.setMaximumDate(max);
                    mCalendarView.setEvents(mEvents);
                } catch (Exception e) {
                    e.getMessage();
                }
                setTodaysCheckInCheckOut();
                setAttedanceCount();
            } else {
                Toast.makeText(getActivity(), "Error Occurred", Toast.LENGTH_SHORT).show();
            }
        } else if (classType.equalsIgnoreCase(GetUsedItemList.class.getSimpleName())) {
            FWLogger.logInfo(TAG, "TECH WISE ITEM List added Successfully");
            Gson gson = new Gson();
            mUsedItemList = new ArrayList<>();
            GetUsedItemList mList = gson.fromJson(urlConnectionResponse.resultData, GetUsedItemList.class);
            mUsedItemList = mList.getResultData();
            try {
                int sumQty = 0;
                List<Integer> listsum = new ArrayList<>();
                for (int i = 0; i < mUsedItemList.size(); i++) {
                    itemLabel.setText(mUsedItemList.get(i).getItemName());
                    listsum.add(mUsedItemList.get(i).getUsedQty());
                    sumQty += listsum.get(i);
                }
                labelTotalqty.setText(String.valueOf(sumQty));
            } catch (Exception e) {
                e.getMessage();
            }
            mLayoutManager = new LinearLayoutManager(getActivity());
            mRecyclerViewTechList.setLayoutManager(mLayoutManager);
            mUsedItemInventoryAdapter = new UsedItemInventoryAdapter(getActivity(), mUsedItemList);
            mUsedItemInventoryAdapter.setClickListener(this);
            mRecyclerViewTechList.setAdapter(mUsedItemInventoryAdapter);

            setSearchFilter();
        }
    }

    private void setAttedanceCount() {
        try {
            txtPresent.setText(String.valueOf(presentCount));
            txtAbsent.setText(String.valueOf(absentCount));
            txtIdle.setText(String.valueOf(idleCount));
        } catch (Exception e) {
            e.getMessage();
        }
    }


    private void setSearchFilter() {
        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) getActivity().getSystemService(Context.SEARCH_SERVICE);
        mSearchView = mRootView.findViewById(R.id.edittext_search);
        mSearchView.setSearchableInfo(searchManager.getSearchableInfo(getActivity().getComponentName()));
        mSearchView.setMaxWidth(Integer.MAX_VALUE);
        mSearchView.setIconified(false);
        mSearchView.clearFocus();
        mSearchView.setOnClickListener(this);
        // listening to search query text change
        mSearchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                // filter recycler view when query submitted
                mUsedItemInventoryAdapter.getFilter().filter(query);
                return false;
            }

            @Override
            public boolean onQueryTextChange(String query) {
                // filter recycler view when text is changed
                mUsedItemInventoryAdapter.getFilter().filter(query);
                return false;
            }
        });
        mSearchView.setOnCloseListener(new SearchView.OnCloseListener() {
            @Override
            public boolean onClose() {
                mSearchView.clearFocus();
                return false;
            }
        });
    }

    @Override
    public void onDateSet(DatePicker view, int year, int month, int dayOfMonth) {
        mMonth = month;
        mYear = year;
        currentMonthName = DateUtils.getMonthName(mMonth);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setText(currentMonthName + " " + mYear);
        getDatesList(mCal, mMonth, ((HomeActivityNew) getActivity()).mSelectedDate);
    }

    @Override
    public void onDestroyView() {
        //((HomeActivityNew) getActivity()).mDatesRecyclerView.setVisibility(View.GONE);
//        ((HomeActivityNew) getActivity()).mSpinnerMonthYear.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setVisibility(View.GONE);
        super.onDestroyView();
    }

    @Override
    public void onClick(View view, int position) {
        if (view.getId() == R.id.edittext_search) {
            mSearchView.setIconified(false);
            mSearchView.setFocusable(true);
        }
        if (view.getId() == R.id.relative_date) {
            DatesDto datesDto = ((HomeActivityNew) getActivity()).mDatesLists.get(position);
            ((HomeActivityNew) getActivity()).mSelectedDate = datesDto.getDate();

            setDates();

            setGetDate(mDate);

        } else {
            //mResultData = mItemInventoryAdapter.getItem(position);
            mTechResultData = mUsedItemInventoryAdapter.getItem(position);
            //UserDialog userDialog = UserDialog.getInstance();
            //userDialog.showTechAttendanceDialog(getContext(), this, mResultData, mTechAttend);
            presentCount = 0;
            absentCount = 0;
            idleCount = 0;
            //showTechAttendanceDialog(getContext(), this, mResultData/*, mTechAttend*/);
        }
    }

    public void showTechAttendanceDialog(Context context, Fragment fragment, UsersList.ResultData resultData/*, List<TechMonthlyAttendance.ResultData> mTechAttend*/) {
        Dialog dialog = new Dialog(context, R.style.DialogSlideAnim);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.dialog_tech_attendance);
        dialog.getWindow().setGravity(Gravity.BOTTOM);

        Button buttonClose = dialog.findViewById(R.id.button_close);
        ImageView imageViewProfile = dialog.findViewById(R.id.technician_image);
        TextView textViewName = dialog.findViewById(R.id.technician_name);
        TextView textViewOccupation = dialog.findViewById(R.id.technician_occupation);
        ImageView imageViewCall = dialog.findViewById(R.id.imageView_call);
        CalendarView mCalendarView = dialog.findViewById(R.id.calendar_attendance);

        txtDate = dialog.findViewById(R.id.txtDate);
        txtCheckIn = dialog.findViewById(R.id.txtCheckIn);
        txtCheckOut = dialog.findViewById(R.id.txtCheckOut);
        txtDayname = dialog.findViewById(R.id.txtDayname);

        txtPresent = dialog.findViewById(R.id.txtPresent);
        txtAbsent = dialog.findViewById(R.id.txtAbsent);
        txtIdle = dialog.findViewById(R.id.txtIdle);

        curvLayoutAbsent = dialog.findViewById(R.id.curvLayoutAbsent);
        curvLayoutPresent = dialog.findViewById(R.id.curvLayoutPresent);
        curvLayoutIdle = dialog.findViewById(R.id.curvLayoutIdle);
        //
        txtStatusAbsent = dialog.findViewById(R.id.txtStatusAbsent);
        txtStatusPresent = dialog.findViewById(R.id.txtStatusPresent);
        txtStatusIdle = dialog.findViewById(R.id.txtStatusIdle);


        ((UsedItemInventoryFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);

        textViewName.setText(resultData.getFirstName() + " " + resultData.getLastName());
        textViewOccupation.setText(resultData.getRole());

        mCalendar = Calendar.getInstance();
        int mYear = mCalendar.get(Calendar.YEAR);
        int mMonth = mCalendar.get(Calendar.MONTH);
//        FWLogger.logInfo(TAG, "mMonth_Dialog : "+mMonth);
        int mDay = mCalendar.get(Calendar.DAY_OF_MONTH);
        mSelectMonth = mMonth;
        mSelectedYear = mYear;
//        FWLogger.logInfo(TAG, "mSelectMonth_Dialog : "+mSelectMonth);

        mCalendarView.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                mCalendar = Calendar.getInstance();
                int mYear = mCalendar.get(Calendar.YEAR);
                int mMonth = mCalendar.get(Calendar.MONTH);
                int mDay = mCalendar.get(Calendar.DAY_OF_MONTH);
                mSelectMonth = mMonth;
                mSelectedYear = mYear;
            }
        });

        mCalendarView.setOnPreviousPageChangeListener(new OnCalendarPageChangeListener() {
            @Override
            public void onChange() {
                // START
                mCalendar = Calendar.getInstance();
                int mYear = mCalendar.get(Calendar.YEAR);
                int mMonth = mCalendar.get(Calendar.MONTH);
                int mDay = mCalendar.get(Calendar.DAY_OF_MONTH);
                mSelectMonth = mMonth;
                mSelectedYear = mYear;

                // COUNTER FOR TOTAL PRESENT/ABSENT/IDLE : START
                presentCount = 0;
                absentCount = 0;
                idleCount = 0;
                // END

                //END
                if (mSelectMonth == 0 || (mSelectMonth == 1 && mSelectedYear == mYear)) {
                    mSelectMonth = 12;
                    mSelectedYear = mSelectedYear - 1;
                } else if (mSelectMonth > 0 && mSelectMonth <= 12) {
                    //mSelectMonth = mSelectMonth - 1; // COMMENTED BY MANSIH : 28-07-2022
                    mSelectMonth = mMonth;
                }
                if (count == 0) {
                    ((UsedItemInventoryFragment) fragment).mDate = mSelectedYear + "-" + mSelectMonth + "-" + ((HomeActivityNew) context).mSelectedDate;
                    ((UsedItemInventoryFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);
                    count++;
                    //Toast.makeText(getActivity(), count, Toast.LENGTH_SHORT).show();
                } else if (count == 1) {
                    mSelectMonth = mMonth - 1;
                    ((UsedItemInventoryFragment) fragment).mDate = mSelectedYear + "-" + mSelectMonth + "-" + ((HomeActivityNew) context).mSelectedDate;
                    ((UsedItemInventoryFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);
                    count = 0;
                }
            }
        });

/*
        mCalendarView.setOnPreviousPageChangeListener(new OnCalendarPageChangeListener() {
            @Override
            public void onChange() {
                // START
                mCalendar = Calendar.getInstance();
                int mYear = mCalendar.get(Calendar.YEAR);
                int mMonth = mCalendar.get(Calendar.MONTH);
                int mDay = mCalendar.get(Calendar.DAY_OF_MONTH);
                mSelectMonth = mMonth;
                mSelectedYear = mYear;

                //END
                if (mSelectMonth == 0 || (mSelectMonth == 1 && mSelectedYear == mYear)) {
                    mSelectMonth = 12;
                    mSelectedYear = mSelectedYear - 1;
                } else if (mSelectMonth > 0 && mSelectMonth <= 12) {
                    //mSelectMonth = mSelectMonth - 1; // COMMENTED BY MANSIH : 28-07-2022
                    mSelectMonth = mMonth;
                }
                ((OwnerAttendanceFragment) fragment).mDate = mSelectedYear + "-" + mSelectMonth + "-" + ((HomeActivityNew) context).mSelectedDate;
                ((OwnerAttendanceFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);
            }
        });
*/

/*
        mCalendarView.setOnForwardPageChangeListener(new OnCalendarPageChangeListener() {
            @Override
            public void onChange() {
                //
                mCalendar = Calendar.getInstance();
                int mYear = mCalendar.get(Calendar.YEAR);
                int mMonth = mCalendar.get(Calendar.MONTH);
                int mDay = mCalendar.get(Calendar.DAY_OF_MONTH);
                mSelectMonth = mMonth;
                mSelectedYear = mYear;
                //
//                mSelectMonth = mSelectMonth + 1;
                if (mSelectMonth == 12) {
                    mSelectMonth = 1;
                    mSelectedYear = mSelectedYear + 1;
                } else if (mSelectMonth < 12 && mSelectMonth > 0) {
                    mSelectMonth = mSelectMonth + 1;
                }
                ((OwnerAttendanceFragment) fragment).mDate = mSelectedYear + "-" + mSelectMonth + "-" + ((HomeActivityNew) context).mSelectedDate;
                ((OwnerAttendanceFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);
            }
        });
*/

        mCalendarView.setOnForwardPageChangeListener(new OnCalendarPageChangeListener() {
            @Override
            public void onChange() {
                //
                mCalendar = Calendar.getInstance();
                int mYear = mCalendar.get(Calendar.YEAR);
                int mMonth = mCalendar.get(Calendar.MONTH);
                int mDay = mCalendar.get(Calendar.DAY_OF_MONTH);
                mSelectMonth = mMonth;
                mSelectedYear = mYear;

                // COUNTER FOR TOTAL PRESENT/ABSENT/IDLE : START
                presentCount = 0;
                absentCount = 0;
                idleCount = 0;
                // END

//                mSelectMonth = mSelectMonth + 1;
                if (mSelectMonth == 12) {
                    mSelectMonth = 1;
                    mSelectedYear = mSelectedYear + 1;
                } else if (mSelectMonth < 12 && mSelectMonth > 0) {
                    mSelectMonth = mMonth;
                }
                if (count == 0) {
                    ((UsedItemInventoryFragment) fragment).mDate = mSelectedYear + "-" + mSelectMonth + "-" + ((HomeActivityNew) context).mSelectedDate;
                    ((UsedItemInventoryFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);
                    count++;
                } else if (count == 1) {
                    mSelectMonth = mMonth + 1;
                    ((UsedItemInventoryFragment) fragment).mDate = mSelectedYear + "-" + mSelectMonth + "-" + ((HomeActivityNew) context).mSelectedDate;
                    ((UsedItemInventoryFragment) fragment).getTechAttendance(resultData.getId(), mCalendarView);
                    count = 0;
                }
            }
        });

        Picasso.get().load(resultData.getPhoto()).placeholder(R.drawable.profile_icon).memoryPolicy(MemoryPolicy.NO_CACHE).networkPolicy(NetworkPolicy.NO_CACHE).into(imageViewProfile, new Callback() {
            @Override
            public void onSuccess() {
            }

            @Override
            public void onError(Exception e) {
                imageViewProfile.setImageResource(R.drawable.profile_icon);
            }
        });

        imageViewCall.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (resultData.getContactNo() != null) {
                    Intent intent = new Intent(Intent.ACTION_DIAL);
                    intent.setData(Uri.parse("tel:" + resultData.getContactNo()));
                    context.startActivity(intent);
                } else {
                    Toast.makeText(context, context.getResources().getString(R.string.contact_no_is_not_available), Toast.LENGTH_SHORT).show();
                }
            }
        });

        buttonClose.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                ((UsedItemInventoryFragment) fragment).setDates();
                dialog.dismiss();
            }
        });


        mCalendarView.setOnDayClickListener(new OnDayClickListener() {
            @Override
            public void onDayClick(EventDay eventDay) {
                try {
                    Date date = new Date(eventDay.getCalendar().getTime().toString());
                    SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
                    String format = formatter.format(date);
                    System.out.println(format);
                    String finalD = format + "T00:00:00";
                    if (mTechAttend.size() > 0) {
                        for (int i = 0; i < mTechAttend.size(); i++) {
                            if (finalD.contains(mTechAttend.get(i).getDate())) {
                                try {
                                    if (mTechAttend.get(i).getAttendanceTypeId() == 2) { // PRESENT
                                        curvLayoutPresent.setVisibility(View.VISIBLE);
                                        curvLayoutAbsent.setVisibility(View.GONE);
                                        curvLayoutIdle.setVisibility(View.GONE);
                                        txtStatusPresent.setText(mTechAttend.get(i).getAttendance());
                                    } else if (mTechAttend.get(i).getAttendanceTypeId() == 3) { // ABSENT
                                        curvLayoutPresent.setVisibility(View.GONE);
                                        curvLayoutAbsent.setVisibility(View.VISIBLE);
                                        curvLayoutIdle.setVisibility(View.GONE);
                                        txtStatusAbsent.setText(mTechAttend.get(i).getAttendance());
                                    } else if (mTechAttend.get(i).getAttendanceTypeId() == 5) { // IDLE
                                        curvLayoutPresent.setVisibility(View.GONE);
                                        curvLayoutAbsent.setVisibility(View.GONE);
                                        curvLayoutIdle.setVisibility(View.VISIBLE);
                                        txtStatusIdle.setText(mTechAttend.get(i).getAttendance());
                                    }
                                    if (mTechAttend.get(i).getCheckIn() == null) {
                                        txtDate.setText(format);
                                        txtCheckIn.setText("-NA-");
                                        txtDayname.setText(String.valueOf(android.text.format.DateFormat.format("EEEE", date)));
                                    } else {
                                        txtDate.setText(mTechAttend.get(i).getCheckIn().split("T")[0]);
                                        txtCheckIn.setText(mTechAttend.get(i).getCheckIn().split("T")[1].split("[.]", 0)[0]);
                                        txtDayname.setText(String.valueOf(android.text.format.DateFormat.format("EEEE", date)));
                                    }
                                    if (mTechAttend.get(i).getCheckOut() == null) {
                                        txtCheckOut.setText("-NA-   ");
                                    } else {
                                        txtDate.setText(mTechAttend.get(i).getCheckOut().split("T")[0]);
                                        txtCheckOut.setText(mTechAttend.get(i).getCheckOut().split("T")[1].split("[.]", 0)[0]);
                                        txtDayname.setText(String.valueOf(android.text.format.DateFormat.format("EEEE", date)));
                                    }
                                } catch (Exception ex) {
                                    ex.getMessage();
                                }
                            }
                        }
                    }
                } catch (Exception ex) {
                    ex.getMessage();
                }
            }
        });
        dialog.show();
    }

    private void setTodaysCheckInCheckOut() {
        try {
            Date date = new Date();
            String currentDate = new SimpleDateFormat("yyyy-MM-dd").format(date);
            String finalD = currentDate + "T00:00:00";
            if (mTechAttend.size() > 0) {
                for (int i = 0; i < mTechAttend.size(); i++) {
                    if (finalD.contains(mTechAttend.get(i).getDate())) {
                        try {
                            if (mTechAttend.get(i).getAttendanceTypeId() == 2) { // PRESENT
                                curvLayoutPresent.setVisibility(View.VISIBLE);
                                curvLayoutAbsent.setVisibility(View.GONE);
                                curvLayoutIdle.setVisibility(View.GONE);
                                txtStatusPresent.setText(mTechAttend.get(i).getAttendance());
                            } else if (mTechAttend.get(i).getAttendanceTypeId() == 3) { // ABSENT
                                curvLayoutPresent.setVisibility(View.GONE);
                                curvLayoutAbsent.setVisibility(View.VISIBLE);
                                curvLayoutIdle.setVisibility(View.GONE);
                                txtStatusAbsent.setText(mTechAttend.get(i).getAttendance());
                            } else if (mTechAttend.get(i).getAttendanceTypeId() == 5) { // IDLE
                                curvLayoutPresent.setVisibility(View.GONE);
                                curvLayoutAbsent.setVisibility(View.GONE);
                                curvLayoutIdle.setVisibility(View.VISIBLE);
                                txtStatusIdle.setText(mTechAttend.get(i).getAttendance());
                            }
                            if (mTechAttend.get(i).getCheckIn() == null) {
                                txtDate.setText("-NA-");
                                txtCheckIn.setText("-NA-");
                            } else {
                                txtDate.setText(mTechAttend.get(i).getCheckIn().split("T")[0]);
                                txtCheckIn.setText(mTechAttend.get(i).getCheckIn().split("T")[1].split("[.]", 0)[0]);
                                txtDayname.setText(String.valueOf(android.text.format.DateFormat.format("EEEE", date)));
                            }
                            if (mTechAttend.get(i).getCheckOut() == null) {
                                txtCheckOut.setText("-NA-");
                            } else {
                                txtDate.setText(mTechAttend.get(i).getCheckOut().split("T")[0]);
                                txtCheckOut.setText(mTechAttend.get(i).getCheckOut().split("T")[1].split("[.]", 0)[0]);
                                txtDayname.setText(String.valueOf(android.text.format.DateFormat.format("EEEE", date)));
                            }
                        } catch (Exception ex) {
                            ex.getMessage();
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.getMessage();
        }
    }

    private void manageBackPress() {

        requireActivity().getOnBackPressedDispatcher().addCallback(getViewLifecycleOwner(), new OnBackPressedCallback(true) {

            @Override
            public void handleOnBackPressed() {

                FWLogger.logInfo(TAG, "Back pressed");

                FragmentManager fm = requireActivity().getSupportFragmentManager();

                Fragment fragment = fm.findFragmentByTag("ItemInventoryDetailsEnhancedFragment");

                if (fragment == null) {

                    fragment = new ItemInventoryDetailsEnhancedFragment();

                    fm.beginTransaction().replace(R.id.home_fragment_container, fragment, "ItemInventoryDetailsEnhancedFragment").commit();

                } else {

                    fm.beginTransaction().replace(R.id.home_fragment_container, fragment, "ItemInventoryDetailsEnhancedFragment").commit();
                }
            }
        });
    }


    @Override
    public void onClick(View v) {

    }
}