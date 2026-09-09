package com.corefield.fieldweb.FieldWeb.AMC;

import android.Manifest;
import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.SearchView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.corefield.fieldweb.Adapter.AMCListAdapter;
import com.corefield.fieldweb.AsyncManager.OnTaskCompleteListener;
import com.corefield.fieldweb.BuildConfig;
import com.corefield.fieldweb.DTO.AMC.AMCList;
import com.corefield.fieldweb.DTO.AMC.AMCTypeList;
import com.corefield.fieldweb.DTO.AMC.AddAMC;
import com.corefield.fieldweb.FieldWeb.Admin.ProfileFragmentNew;
import com.corefield.fieldweb.FieldWeb.Dialogs.FWDialog;
import com.corefield.fieldweb.FieldWeb.Dialogs.ServiceDialog;
import com.corefield.fieldweb.FieldWeb.HomeActivityNew;
import com.corefield.fieldweb.Listener.RecyclerTouchListener;
import com.corefield.fieldweb.Network.URLConnectionResponse;
import com.corefield.fieldweb.R;
import com.corefield.fieldweb.Retrofit.RetrofitClient;
import com.corefield.fieldweb.Util.CommonFunction;
import com.corefield.fieldweb.Util.Connectivity;
import com.corefield.fieldweb.Util.DateUtils;
import com.corefield.fieldweb.Util.FWLogger;
import com.corefield.fieldweb.Util.FirebaseGoogleAnalytics;
import com.corefield.fieldweb.Util.SharedPrefManager;
import com.google.android.gms.common.api.Status;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.widget.Autocomplete;
import com.google.android.libraries.places.widget.AutocompleteActivity;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.gson.Gson;

import java.text.DateFormatSymbols;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

import static android.app.Activity.RESULT_CANCELED;
import static android.app.Activity.RESULT_OK;

import retrofit2.Call;
import retrofit2.Response;

/**
 * Fragment Controller for AMCListFragment
 *
 * @author CoreField
 * @version 1.1
 * @implNote This Fragment class is used for to show AMC list
 */
public class AMCListFragment extends Fragment implements OnTaskCompleteListener, RecyclerTouchListener, View.OnClickListener {
    protected static String TAG = AMCListFragment.class.getSimpleName();
    private View mRootView;
    private RecyclerView mRecyclerViewAMCList;
    private AMCListAdapter mAmcListAdapter;
    private RecyclerView.LayoutManager mLayoutManager;
    private List<AMCList.ResultData> mAMCList = null;
    private List<AMCTypeList.ResultData> mAMCTypeLists = null;
    private List<Integer> mMonthList = null;
    private String mSelectedDate;
    private int mSelectedType = 0;
    Calendar mCal;
    int mCurrentYear;
    int mCurrentMonth;
    int mCurrentDay;
    public static final int AUTOCOMPLETE_REQUEST_CODE = 23487;
    Button plusAMC;
    private SearchView mSearchView;
    RecyclerTouchListener recyclerTouchListener;
    ImageView noResultImg;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mRootView = inflater.inflate(R.layout.fragment_amc_list, container, false);
       /* ((HomeActivityNew) getActivity()).mRelativeHeaderLayout.setVisibility(View.VISIBLE);
        ((HomeActivityNew) getActivity()).textViewUsername.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mSpinnerAMCType.setVisibility(View.VISIBLE);
        ((HomeActivityNew) getActivity()).mTextViewSpace.setVisibility(View.VISIBLE);
//        ((HomeActivityNew) getActivity()).mSpinnerMonthYear.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setVisibility(View.GONE);
//        ((HomeActivityNew) getActivity()).mSpinnerMonthYear.setVisibility(View.VISIBLE);
        ((HomeActivityNew) getActivity()).mSpinnerAMCMonthYear.setVisibility(View.VISIBLE);*/

        mCal = Calendar.getInstance();
        mCurrentYear = mCal.get(Calendar.YEAR);
        mCurrentMonth = mCal.get(Calendar.MONTH) + 1;
        mCurrentDay = mCal.get(Calendar.DAY_OF_MONTH);

        getMonthYearListForAMC(mCal, mCurrentYear, mCurrentMonth);

        inIt();
        FGALoadEvent();
        return mRootView;
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        HomeActivityNew activity = (HomeActivityNew) getActivity();
        ((HomeActivityNew) getActivity()).textViewUsername.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setVisibility(View.GONE);

        if (activity != null && activity.mRelativeHeaderLayout != null) {
            activity.mRelativeHeaderLayout.post(() -> activity.mRelativeHeaderLayout.setVisibility(View.VISIBLE));

        }
        if (activity != null && activity.mSpinnerAMCMonthYear != null) {
            activity.mSpinnerAMCMonthYear.post(() -> activity.mSpinnerAMCMonthYear.setVisibility(View.VISIBLE));

        }
        if (activity != null && activity.mSpinnerAMCType != null) {
            activity.mSpinnerAMCType.post(() -> activity.mSpinnerAMCType.setVisibility(View.VISIBLE));

        }
        if (activity != null && activity.mTextViewSpace != null) {
            activity.mTextViewSpace.post(() -> activity.mTextViewSpace.setVisibility(View.VISIBLE));

        }

    }


    private void FGALoadEvent() {
        //NOTE: Log GA event
        Bundle bundle = new Bundle();
        bundle.putInt(FirebaseGoogleAnalytics.Param.USER_ID, SharedPrefManager.getInstance(getContext()).getUserId());
        bundle.putString(FirebaseGoogleAnalytics.Param.VERSION_NAME, BuildConfig.VERSION_NAME);
        bundle.putString(FirebaseGoogleAnalytics.Param.USER_TYPE, SharedPrefManager.getInstance(getContext()).getUserGroup());
        bundle.putString(FirebaseGoogleAnalytics.Param.TIME_STAMP, DateUtils.getDateForWithGAFormat());
        bundle.putString(FirebaseGoogleAnalytics.Param.PLATFORM, FirebaseGoogleAnalytics.Defaults.PLATFORM_ANDROID);
        FirebaseAnalytics.getInstance(getContext()).logEvent(FirebaseGoogleAnalytics.Event.AMC, bundle);
    }

    private void inIt() {
        recyclerTouchListener = this;
        mRecyclerViewAMCList = mRootView.findViewById(R.id.recycler_amc_list);
        plusAMC = mRootView.findViewById(R.id.plus_amc);
        mSearchView = mRootView.findViewById(R.id.searchView_AMC);
        noResultImg = mRootView.findViewById(R.id.noResultImg);
        getAMCTypes();

        getAMCList();

        ((HomeActivityNew) getActivity()).mSpinnerAMCType.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                AMCTypeList.ResultData resultData = (AMCTypeList.ResultData) parent.getSelectedItem();
                mSelectedType = resultData.getAMCTypeId();
                FWLogger.logInfo(TAG, "AMC Type selected: " + resultData.getAMCTypeName() + " (ID: " + mSelectedType + ")");
                FWLogger.logInfo(TAG, "Fetching AMC list with selected type: " + mSelectedType + " and date: " + mSelectedDate);
                getAMCList();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });

        plusAMC.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ((HomeActivityNew) getActivity()).serviceOccurrenceTask();
            }
        });

        ((HomeActivityNew) getActivity()).mSpinnerAMCMonthYear.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                FWLogger.logInfo(TAG, "Month selection changed - position: " + position);
                String selectedMonthName = parent.getItemAtPosition(position).toString();
                FWLogger.logInfo(TAG, "Selected month name: " + selectedMonthName);
                
                // Extract year from selected month name (e.g., "May 2026" -> "2026")
                String[] monthParts = selectedMonthName.split(" ");
                if (monthParts.length > 1) {
                    try {
                        int selectedYear = Integer.parseInt(monthParts[1]);
                        int selectedMonth = mMonthList.get(position);
                        
                        // Format date as month-day-year (e.g., 5-27-2026)
                        mSelectedDate = String.format("%d-%d-%d", selectedMonth, mCurrentDay, selectedYear);
                        
                        FWLogger.logInfo(TAG, "Updated date to: " + mSelectedDate);
                        FWLogger.logInfo(TAG, "Fetching AMC data with new date and type: " + mSelectedType);
                        
                        // Fetch AMC list with new date
                        getAMCList();
                    } catch (NumberFormatException e) {
                        FWLogger.logInfo(TAG, "Error parsing year from selected month: " + e.getMessage());
                    }
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });

        mAMCTypeLists = new ArrayList<>();
        mAMCTypeLists.add(new AMCTypeList.ResultData(0, "Select AMC Type"));
        ArrayAdapter<AMCTypeList.ResultData> arrayAdapterAMCType = new ArrayAdapter<AMCTypeList.ResultData>(getActivity(), android.R.layout.simple_spinner_item, mAMCTypeLists) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                View v = super.getView(position, convertView, parent);
                ((TextView) v.findViewById(android.R.id.text1)).setTextColor(Color.WHITE);
                if (position == getCount()) {
                    ((TextView) v.findViewById(android.R.id.text1)).setText("");
                    ((TextView) v.findViewById(android.R.id.text1)).setHintTextColor(Color.WHITE);
                }
                return v;
            }

            @Override
            public int getCount() {
                return super.getCount(); // you don't display last item. It is used as hint.
            }
        };
        arrayAdapterAMCType.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        ((HomeActivityNew) getActivity()).mSpinnerAMCType.setAdapter(arrayAdapterAMCType);
        ((HomeActivityNew) getActivity()).mSpinnerAMCType.setSelection(0);  //arrayAdapterMonthYearType.getCount()
    }

    private void getAMCTypes() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                CommonFunction.showProgressDialog(getActivity());
                
                // Fetch AMC types using the API endpoint
                Call<AMCTypeList> call = RetrofitClient.getInstance(getContext()).getMyApi().getAMCTypes();
                    
                call.enqueue(new retrofit2.Callback<AMCTypeList>() {
                    @Override
                    public void onResponse(Call<AMCTypeList> call, Response<AMCTypeList> response) {
                        try {
                            if (response.code() == 200) {
                                CommonFunction.hideProgressDialog(getActivity());
                                AMCTypeList amcTypeList = response.body();
                                if (amcTypeList != null && amcTypeList.getResultData() != null) {
                                    // Filter out "Completed" type if present
                                    for (int i = 0; i < amcTypeList.getResultData().size(); i++) {
                                        AMCTypeList.ResultData resultData = amcTypeList.getResultData().get(i);
                                        if (resultData.getAMCTypeId() != 1 && !resultData.getAMCTypeName().equalsIgnoreCase("Completed")) {
                                            mAMCTypeLists.add(new AMCTypeList.ResultData(resultData.getAMCTypeId(), resultData.getAMCTypeName()));
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            CommonFunction.hideProgressDialog(getActivity());
                            FWLogger.logInfo(TAG, "Exception parsing AMC Types: " + e.getMessage());
                        }
                    }

                    @Override
                    public void onFailure(Call<AMCTypeList> call, Throwable throwable) {
                        CommonFunction.hideProgressDialog(getActivity());
                        FWLogger.logInfo(TAG, "Exception in AMCDashboardDetailsWebV2 API - getAMCTypes: " + throwable.getMessage());
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            CommonFunction.hideProgressDialog(getActivity());
            FWLogger.logInfo(TAG, "Exception in getAMCTypes: " + ex.getMessage());
        }
    }

    private void getAMCList() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                setSearchFilter();
                CommonFunction.showProgressDialog(getActivity());
                
                // Call getAMCList API with parameters: userId, date (month-day-year format), AMCTypeId
                // This internally calls AMCDashboardDetailsWebV2?OwnerId={userId}&Date={date}&AMCTypeId={type}
                FWLogger.logInfo(TAG, "Fetching AMC List with Date: " + mSelectedDate + ", Type: " + mSelectedType);
                
                Call<AMCList> call = RetrofitClient.getInstance(getContext()).getMyApi()
                    .getAMCList(
                        SharedPrefManager.getInstance(getContext()).getUserId(), 
                        mSelectedDate, 
                        mSelectedType
                    );
                    
                call.enqueue(new retrofit2.Callback<AMCList>() {
                    @Override
                    public void onResponse(Call<AMCList> call, Response<AMCList> response) {
                        try {
                            CommonFunction.hideProgressDialog(getActivity());
                            if (response.code() == 200) {
                                FWLogger.logInfo(TAG, "AMC List fetched successfully from API");
                                AMCList amcList = response.body();
                                
                                if (amcList != null && amcList.getResultData() != null && getContext() != null) {
                                    mAMCList = new ArrayList<>();
                                    mAMCList = amcList.getResultData();
                                    
                                    if (mAMCList.size() > 0) {
                                        mRecyclerViewAMCList.setVisibility(View.VISIBLE);
                                        noResultImg.setVisibility(View.GONE);
                                        
                                        mLayoutManager = new LinearLayoutManager(getContext());
                                        mRecyclerViewAMCList.setLayoutManager(mLayoutManager);
                                        mAmcListAdapter = new AMCListAdapter(getContext(), mAMCList, recyclerTouchListener);
                                        mAmcListAdapter.setClickListener(recyclerTouchListener);
                                        mRecyclerViewAMCList.setAdapter(mAmcListAdapter);
                                        
                                        FWLogger.logInfo(TAG, "AMC List size: " + mAMCList.size());
                                    } else {
                                        mRecyclerViewAMCList.setVisibility(View.GONE);
                                        noResultImg.setVisibility(View.VISIBLE);
                                        noResultImg.setImageDrawable(getContext().getResources().getDrawable(R.drawable.ic_noresultfound));
                                        FWLogger.logInfo(TAG, "No AMC records found for selected date: " + mSelectedDate + " and type: " + mSelectedType);
                                    }
                                } else {
                                    CommonFunction.hideProgressDialog(getActivity());
                                    mRecyclerViewAMCList.setVisibility(View.GONE);
                                    noResultImg.setVisibility(View.VISIBLE);
                                }
                            } else {
                                CommonFunction.hideProgressDialog(getActivity());
                                FWLogger.logInfo(TAG, "API response code: " + response.code());
                                mRecyclerViewAMCList.setVisibility(View.GONE);
                                noResultImg.setVisibility(View.VISIBLE);
                            }
                        } catch (Exception e) {
                            CommonFunction.hideProgressDialog(getActivity());
                            FWLogger.logInfo(TAG, "Exception parsing AMC List response: " + e.getMessage());
                            mRecyclerViewAMCList.setVisibility(View.GONE);
                            noResultImg.setVisibility(View.VISIBLE);
                        }
                    }

                    @Override
                    public void onFailure(Call<AMCList> call, Throwable throwable) {
                        CommonFunction.hideProgressDialog(getActivity());
                        FWLogger.logInfo(TAG, "Exception in AMC List API: " + throwable.getMessage());
                        mRecyclerViewAMCList.setVisibility(View.GONE);
                        noResultImg.setVisibility(View.VISIBLE);
                        if (getContext() != null) {
                            noResultImg.setImageDrawable(getContext().getResources().getDrawable(R.drawable.ic_noresultfound));
                        }
                    }
                });
            } else {
                CommonFunction.hideProgressDialog(getActivity());
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            CommonFunction.hideProgressDialog(getActivity());
            FWLogger.logInfo(TAG, "Exception in getAMCList: " + ex.getMessage());
        }
    }

    private void getMonthYearListForAMC(Calendar cal, int currentYear, int currentMonth) {
        List<String> monthYearList = new ArrayList<String>();
        mMonthList = new ArrayList<Integer>();

        String[] mons = new DateFormatSymbols(Locale.ENGLISH).getShortMonths();
        String currentMonthName = mons[currentMonth - 1];

        // Generate months for current year with proper formatting
        for (int i = 0; i < mons.length; i++) {
            monthYearList.add(mons[i] + " " + currentYear);
            int month = i + 1;
            mMonthList.add(month);
        }

        // Create custom adapter with improved styling
        ArrayAdapter<String> arrayAdapterMonthYearType = new ArrayAdapter<String>(getActivity(), android.R.layout.simple_spinner_item, monthYearList) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                View v = super.getView(position, convertView, parent);
                ((TextView) v.findViewById(android.R.id.text1)).setTextColor(Color.WHITE);
                ((TextView) v.findViewById(android.R.id.text1)).setTextSize(14);
                if (position == getCount()) {
                    ((TextView) v.findViewById(android.R.id.text1)).setText("");
                    ((TextView) v.findViewById(android.R.id.text1)).setHint(getItem(0));
                    ((TextView) v.findViewById(android.R.id.text1)).setHintTextColor(Color.WHITE);
                }
                return v;
            }

            @Override
            public int getCount() {
                return super.getCount();
            }

            @Override
            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                View v = super.getDropDownView(position, convertView, parent);
                if (v instanceof TextView) {
                    ((TextView) v).setTextColor(Color.BLACK);
                    ((TextView) v).setPadding(20, 15, 20, 15);
                }
                return v;
            }
        };
        arrayAdapterMonthYearType.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        ((HomeActivityNew) getActivity()).mSpinnerAMCMonthYear.setAdapter(arrayAdapterMonthYearType);
        ((HomeActivityNew) getActivity()).mSpinnerAMCMonthYear.setSelection(currentMonth - 1);
        
        // Store selected date values
        ((HomeActivityNew) getActivity()).mSelectedMonth = currentMonth;
        ((HomeActivityNew) getActivity()).mSelectedYear = currentYear;
        ((HomeActivityNew) getActivity()).mSelectedMonthName = currentMonthName;
        
        // Format date as month-day-year (e.g., 5-27-2026)
        mSelectedDate = String.format("%d-%d-%d", mMonthList.get(currentMonth - 1), mCurrentDay, currentYear);
    }

    @Override
    public void onTaskComplete(URLConnectionResponse urlConnectionResponse, String classType) {
        if (classType.equalsIgnoreCase(AMCList.class.getSimpleName())) {
            FWLogger.logInfo(TAG, "List added Successfully");
            Gson gson = new Gson();
            mAMCList = new ArrayList<>();
            AMCList amcList = gson.fromJson(urlConnectionResponse.resultData, AMCList.class);
            mAMCList = amcList.getResultData();
            if (mAMCList != null && getContext() != null) {
                mLayoutManager = new LinearLayoutManager(getContext());
                mRecyclerViewAMCList.setLayoutManager(mLayoutManager);
                mAmcListAdapter = new AMCListAdapter(getContext(), mAMCList, this);
                mAmcListAdapter.setClickListener(this);
                mRecyclerViewAMCList.setAdapter(mAmcListAdapter);
                setSearchFilter();
            }
        } else if (classType.equalsIgnoreCase(AMCTypeList.class.getSimpleName())) {
            Gson gson = new Gson();
            AMCTypeList amcTypeList = gson.fromJson(urlConnectionResponse.resultData, AMCTypeList.class);
            if (amcTypeList != null) {
                if (amcTypeList.getCode().equalsIgnoreCase("200") && amcTypeList.getMessage().equalsIgnoreCase("successfully.")) {
                    for (int i = 0; i < amcTypeList.getResultData().size(); i++) {
                        mAMCTypeLists.add(new AMCTypeList.ResultData(amcTypeList.getResultData().get(i).getAMCTypeId(), amcTypeList.getResultData().get(i).getAMCTypeName()));
                    }
                }
            }
        } else if (classType.equalsIgnoreCase(AddAMC.class.getSimpleName())) {
            FWLogger.logInfo(TAG, "Inside AMC response");
            Gson gson = new Gson();
            AddAMC addAMC = gson.fromJson(urlConnectionResponse.resultData, AddAMC.class);
            //NOTE: Log GA event
            Bundle bundle = new Bundle();
            bundle.putInt(FirebaseGoogleAnalytics.Param.USER_ID, SharedPrefManager.getInstance(getContext()).getUserId());
            bundle.putString(FirebaseGoogleAnalytics.Param.VERSION_NAME, BuildConfig.VERSION_NAME);
            bundle.putString(FirebaseGoogleAnalytics.Param.USER_TYPE, SharedPrefManager.getInstance(getContext()).getUserGroup());
            bundle.putString(FirebaseGoogleAnalytics.Param.TIME_STAMP, DateUtils.getDateForWithGAFormat());
            bundle.putString(FirebaseGoogleAnalytics.Param.PLATFORM, FirebaseGoogleAnalytics.Defaults.PLATFORM_ANDROID);
            bundle.putString(FirebaseGoogleAnalytics.Param.OPERATION, FirebaseGoogleAnalytics.Defaults.CONFIRMATION);
            FirebaseAnalytics.getInstance(getContext()).logEvent(FirebaseGoogleAnalytics.Event.ADD_AMC, bundle);
            if (addAMC != null) {
                if (addAMC.getCode().equalsIgnoreCase("200")) {
                    FWLogger.logInfo(TAG, "" + addAMC.getMessage());
                    Toast.makeText(getActivity(), addAMC.getMessage(), Toast.LENGTH_SHORT).show();
                } else {
                    FWLogger.logInfo(TAG, "" + addAMC.getMessage());
                    Toast.makeText(getActivity(), addAMC.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == AUTOCOMPLETE_REQUEST_CODE) {
            if (resultCode == RESULT_OK) {
                Place place = Autocomplete.getPlaceFromIntent(data);
                FWLogger.logInfo(TAG, "AMC Place : " + place.getName() + ", ID : " + place.getId() + ", Address : " + place.getAddress() + ", longitude : " + place.getLatLng().longitude + ", latitude : " + place.getLatLng().latitude);
                if (place != null) FWDialog.callback(place);
            } else if (resultCode == AutocompleteActivity.RESULT_ERROR) {
                // TODO: Handle the error.
                Status status = Autocomplete.getStatusFromIntent(data);
                FWLogger.logInfo(TAG, status.getStatusMessage());
            } else if (resultCode == RESULT_CANCELED) {
                // The user canceled the operation.
                FWLogger.logInfo(TAG, "Request has canceled");
            }
        }
    }

    @Override
    public void onClick(View view, int position) {
        FWLogger.logInfo(TAG, "Recycler Item Clicked");
        checkStoragePermission();
        loadFragment(mAmcListAdapter.getItem(position).getAMCsId(), mAmcListAdapter.getItem(position).getAMCServiceDetailsId(), mAmcListAdapter.getItem(position).getAMCTypeName());
    }

    private void loadFragment(int AMCsId, int AMCServiceDetailsId, String AMCTypeName) {
        FragmentManager fragmentManager = getFragmentManager();
        AMCDetailsFragment amcDetailsFragment = new AMCDetailsFragment();
        Bundle args = new Bundle();
        args.putInt("AMCsId", AMCsId);
        args.putInt("AMCServiceDetailsId", AMCServiceDetailsId);
        args.putString("AMCTypeName", AMCTypeName);
        amcDetailsFragment.setArguments(args);
        FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();
        /*fragmentTransaction.replace(R.id.home_fragment_container, amcDetailsFragment, "AMC Details");*/
        fragmentTransaction.add(R.id.home_fragment_container, amcDetailsFragment, "AMC Details");
        fragmentTransaction.addToBackStack(null);
        fragmentTransaction.commit();
    }

    private boolean checkStoragePermission() {
        boolean storageFlag = false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                final int checkWriteStorage = ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.WRITE_EXTERNAL_STORAGE);
                final int checkReadStorage = ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.READ_EXTERNAL_STORAGE);
                if (checkWriteStorage != PackageManager.PERMISSION_GRANTED && checkReadStorage != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{android.Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE}, ProfileFragmentNew.REQUEST_CODE_PERMISSIONS);
                } else {
                    storageFlag = true;
                }
            }
        } catch (Exception ex) {
            ex.getMessage();
        }

        return storageFlag;
    }


    @Override
    public void onDestroyView() {
        CommonFunction.hideProgressDialog(getActivity());
        ((HomeActivityNew) getActivity()).textViewUsername.setVisibility(View.VISIBLE);
        ((HomeActivityNew) getActivity()).mSpinnerAMCType.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mTextViewSpace.setVisibility(View.GONE);
//        ((HomeActivityNew) getActivity()).mSpinnerMonthYear.setVisibility(View.VISIBLE);
//        ((HomeActivityNew) getActivity()).mSpinnerMonthYear.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mSpinnerAMCMonthYear.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).isAMCOpen = false;

        super.onDestroyView();
    }

    private void setSearchFilter() {
        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) getActivity().getSystemService(Context.SEARCH_SERVICE);
        mSearchView.setSearchableInfo(searchManager.getSearchableInfo(getActivity().getComponentName()));
        mSearchView.setMaxWidth(Integer.MAX_VALUE);
        mSearchView.setIconified(false);
        mSearchView.clearFocus();
        mSearchView.setOnClickListener(this);

        // listening to search query text change
        mSearchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                if (mAmcListAdapter != null) mAmcListAdapter.getFilter().filter(query);
                return false;
            }

            @Override
            public boolean onQueryTextChange(String query) {

                if (mAmcListAdapter != null) mAmcListAdapter.getFilter().filter(query);
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
    public void onClick(View v) {

    }

    @Override
    public void onResume() {
        super.onResume();
        HomeActivityNew activity = (HomeActivityNew) getActivity();
        if (activity != null) {
            // Hide or visible these when fragment is visible
            if (activity.mRelativeHeaderLayout != null)
                activity.mRelativeHeaderLayout.setVisibility(View.VISIBLE);

            if (activity != null && activity.textViewUsername != null)
                activity.textViewUsername.setVisibility(View.GONE);

            if (activity.mSpinnerAMCType != null)
                activity.mSpinnerAMCType.setVisibility(View.VISIBLE);

            if (activity.mTextViewSpace != null)
                activity.mTextViewSpace.setVisibility(View.VISIBLE);

            if (activity.mEditTextYearMonth != null)
                activity.mEditTextYearMonth.setVisibility(View.GONE);

            if (activity.mSpinnerAMCMonthYear != null)
                activity.mSpinnerAMCMonthYear.setVisibility(View.VISIBLE);
        }
    }
}