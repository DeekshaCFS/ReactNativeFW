package com.corefield.fieldweb.FieldWeb.AMC;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.corefield.fieldweb.Adapter.ServiceListAdapter;
import com.corefield.fieldweb.AsyncManager.OnTaskCompleteListener;
import com.corefield.fieldweb.BuildConfig;
import com.corefield.fieldweb.DTO.AMC.AMCDetails;
import com.corefield.fieldweb.DTO.AMC.DeleteAMC;
import com.corefield.fieldweb.DTO.AMC.EditAMCDTO;
import com.corefield.fieldweb.DTO.AMC.ReminderModeList;
import com.corefield.fieldweb.DTO.AMC.ServiceOccurrenceList;
import com.corefield.fieldweb.DTO.Task.DownloadReport;
import com.corefield.fieldweb.FieldWeb.Dialogs.AMCDialog;
import com.corefield.fieldweb.FieldWeb.Dialogs.FWDialog;
import com.corefield.fieldweb.FieldWeb.Dialogs.ServiceDialog;
import com.corefield.fieldweb.FieldWeb.HomeActivityNew;
import com.corefield.fieldweb.Network.URLConnectionResponse;
import com.corefield.fieldweb.R;
import com.corefield.fieldweb.Retrofit.RetrofitClient;
import com.corefield.fieldweb.Util.Connectivity;
import com.corefield.fieldweb.Util.DateUtils;
import com.corefield.fieldweb.Util.DownloadFile;
import com.corefield.fieldweb.Util.FWLogger;
import com.corefield.fieldweb.Util.FirebaseGoogleAnalytics;
import com.corefield.fieldweb.Util.SharedPrefManager;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Response;

public class AMCDetailsFragment extends Fragment implements OnTaskCompleteListener {//} implements View.OnClickListener{
    protected static String TAG = AMCDetailsFragment.class.getSimpleName();
    private View mRootView;
    AMCDetails mAmcDetails = null;
    EditAMCDTO editAMCDTO = null;
    private String countryCode, number, phoneNumber;

    //EditAMCDTO editAMCDTO = null;
    int mAMCsId;
    int mAMCServiceDetailsId;
    String mAMCTypeName = "";
    private RecyclerView mRecyclerViewServiceList;
    private ServiceListAdapter mServiceListAdapter;
    private RecyclerView.LayoutManager mLayoutManager;
    int mServicesDone = 0, custId = 0;
    private List<ServiceOccurrenceList.ResultData> mServiceOccurrenceResultList;
    private List<ReminderModeList.ResultData> mReminderModeResultList;

    private TextView mTextViewAMCName, mTextViewAMCContactNo, mTextViewCustomerName, mTextViewCustomerNumber, mTextViewCustomerAddress, mTextViewProductBrand, mTextViewSerialNumber, mTextViewUnderWarranty, mTextViewActivationDate, mTextViewContractDate, mTextViewExpiryDate, mTextViewNumberOfServices, mTextViewReminder, mTextViewServiceOccurrence, mTextViewServicesCompleted, mTextViewStatus, mTextViewCustomerEmail, mTextViewProductName, mTextViewAmount, mTextViewRemainingAmt, mTextViewServiceDetails, mTextViewCustomerLandmark, mTextViewAMCStatus, mTextViewAMCNote;

    private ImageView mImageViewDownloadReport, mImageViewAddTask, mImageViewCall, mImageViewMessage, mImageVieDeleteAmc, mimgViw_EditAmc;
    private static final String[] PERMISSIONS = {android.Manifest.permission.READ_EXTERNAL_STORAGE, android.Manifest.permission.WRITE_EXTERNAL_STORAGE, android.Manifest.permission.INTERNET};

    private static final String[] PERMISSIONS_TIRAMISU = {android.Manifest.permission.READ_MEDIA_VIDEO, android.Manifest.permission.READ_MEDIA_IMAGES, android.Manifest.permission.READ_MEDIA_AUDIO};

    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mRootView = inflater.inflate(R.layout.fragment_amc_details_new, container, false);
        ((HomeActivityNew) getActivity()).mRelativeHeaderLayout.setVisibility(View.GONE);

        mAmcDetails = new AMCDetails();
        inIt();
        manageBackPress();

        return mRootView;
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
       /* HomeActivityNew activity = (HomeActivityNew) getActivity();
        if (activity != null && activity.mRelativeHeaderLayout != null) {
            ((HomeActivityNew) getActivity()).mRelativeHeaderLayout.setVisibility(View.GONE);
        }*/
    }

    private void manageBackPress() {
        mRootView.setFocusableInTouchMode(true);
        mRootView.requestFocus();
        mRootView.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_BACK) {
                    FWLogger.logInfo(TAG, "setOnKeyListener()");
                    ((HomeActivityNew) getActivity()).loadFragment(new AMCListFragment(), R.id.navigation_home);
                    return true;
                }
                return false;
            }
        });
    }


    private void inIt() {
        if (getArguments() != null) {
            mAMCsId = getArguments().getInt("AMCsId");
            mAMCServiceDetailsId = getArguments().getInt("AMCServiceDetailsId");
            mAMCTypeName = getArguments().getString("AMCTypeName");
        }

        mTextViewAMCName = mRootView.findViewById(R.id.textView_AMC_name);
        mTextViewAMCContactNo = mRootView.findViewById(R.id.textView_amc_contact_number);
        mTextViewCustomerName = mRootView.findViewById(R.id.textView_customer_name);
        mTextViewCustomerNumber = mRootView.findViewById(R.id.textView_customer_number);
        mTextViewCustomerAddress = mRootView.findViewById(R.id.textView_customer_address);
        mTextViewCustomerLandmark = mRootView.findViewById(R.id.textView_customer_landmark);
        mTextViewProductBrand = mRootView.findViewById(R.id.textView_product_brand);
        mTextViewSerialNumber = mRootView.findViewById(R.id.textView_serial_number);
        mTextViewUnderWarranty = mRootView.findViewById(R.id.textView_under_warranty);
        mTextViewActivationDate = mRootView.findViewById(R.id.textView_activation_date);

        mTextViewContractDate = mRootView.findViewById(R.id.textView_contract_date);
        mTextViewExpiryDate = mRootView.findViewById(R.id.textView_expiry_date);

        mTextViewNumberOfServices = mRootView.findViewById(R.id.textView_no_of_services);
        mTextViewReminder = mRootView.findViewById(R.id.textView_reminder);
        mTextViewServiceOccurrence = mRootView.findViewById(R.id.textView_service_occurrence);
        mTextViewServicesCompleted = mRootView.findViewById(R.id.textView_service_completed);
        mTextViewCustomerEmail = mRootView.findViewById(R.id.textView_customer_email);
        mTextViewAMCStatus = mRootView.findViewById(R.id.textView_status);
        mTextViewAMCNote = mRootView.findViewById(R.id.textView_note);

        mTextViewProductName = mRootView.findViewById(R.id.textView_product_name);
        mTextViewAmount = mRootView.findViewById(R.id.textView_amount);
        mTextViewRemainingAmt = mRootView.findViewById(R.id.textView_Remainamount);
        mTextViewServiceDetails = mRootView.findViewById(R.id.textView_service_details);

        mTextViewStatus = mRootView.findViewById(R.id.textView_statuss);
        mImageViewAddTask = mRootView.findViewById(R.id.imageView_add_task);
        mImageVieDeleteAmc = mRootView.findViewById(R.id.imageView_delete_amc);
        mimgViw_EditAmc = mRootView.findViewById(R.id.imgViw_EditAmc);
        mImageViewCall = mRootView.findViewById(R.id.imageView_call);
        mImageViewMessage = mRootView.findViewById(R.id.imageView_message);
        mRecyclerViewServiceList = mRootView.findViewById(R.id.recycler_service_list);
        mImageViewDownloadReport = mRootView.findViewById(R.id.imageView_download);

        FGALoadEvent();
        getAMCDetailsTask(mAMCsId, mAMCServiceDetailsId);

        mImageViewCall.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
               /* if (mTextViewAMCContactNo.getText().toString() != null && !mTextViewAMCContactNo.getText().toString().isEmpty()) {
                    Intent intent = new Intent(Intent.ACTION_DIAL);
                    intent.setData(Uri.parse("tel:" + mTextViewAMCContactNo.getText().toString()));
                    startActivity(intent);
                }*/
                if (mTextViewAMCContactNo.getText().toString() != null && !mTextViewAMCContactNo.getText().toString().isEmpty()) {
                    Intent intent = new Intent(Intent.ACTION_DIAL);
                    Uri numberUri = Uri.fromParts("tel:", mTextViewAMCContactNo.getText().toString().trim(), null);
                    intent.setData(numberUri);
                    startActivity(intent);
                } else {
                    Toast.makeText(getContext(), getResources().getString(R.string.contact_no_is_not_available), Toast.LENGTH_SHORT).show();
                }
            }
        });

        mImageViewMessage.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mTextViewAMCContactNo.getText().toString() != null && !mTextViewAMCContactNo.getText().toString().isEmpty()) {
                    try {
                        number = mTextViewAMCContactNo.getText().toString();  // The number on which you want to send SMS
                        Uri uri = Uri.parse("https://wa.me/" + number);
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        //String number = mTextViewAMCContactNo.getText().toString();  // The number on which you want to send SMS
                        //startActivity(new Intent(Intent.ACTION_VIEW, Uri.fromParts("sms", number, null)));
                    } catch (Exception e) {
                        Toast.makeText(getContext(), R.string.unable_to_open_message_app, Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(getContext(), getResources().getString(R.string.contact_no_is_not_available), Toast.LENGTH_SHORT).show();
                }
            }
        });

        mImageViewAddTask.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mAMCTypeName != null) {
                    if (mAMCTypeName.equalsIgnoreCase("Expired")) {
                        Toast toast = Toast.makeText(getActivity(), R.string.amc_expired_can_not_add_task, Toast.LENGTH_LONG);
                        toast.setGravity(Gravity.CENTER, 0, 0);
                        toast.show();
                    } else if (!mAmcDetails.getResultData().isUpcomingServiceActive() || mAmcDetails.getResultData().getUpcomingAmcsServiceDate() == null) {
                        Toast toast = Toast.makeText(getActivity(), R.string.can_not_add_task_for_selected_date, Toast.LENGTH_LONG);
                        toast.setGravity(Gravity.CENTER, 0, 0);
                        toast.show();
                    } else if (mAmcDetails.getResultData().isUpcomingServiceActive() && mAmcDetails.getResultData().getUpcomingAmcsServiceDate() != null) { //This need to change
                        AMCDetails.ResultData AMCResultData = mAmcDetails.getResultData();
                        custId = AMCResultData.getProductDetail().getCustomerDetailInfoDto().getCustomerDetailsid();
                        ((HomeActivityNew) getActivity()).addTask(mAMCServiceDetailsId, true, AMCResultData, custId);
                    } else {
                        Toast toast = Toast.makeText(getActivity(), R.string.can_not_add_task_at_this_movement, Toast.LENGTH_LONG);
                        toast.setGravity(Gravity.CENTER, 0, 0);
                        toast.show();
                    }
                }
            }
        });

        mImageViewDownloadReport.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                getDownloadReport(mAMCsId);
            }
        });

        mImageVieDeleteAmc.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                deleteAMCDialog(getActivity());
            }
        });

        mimgViw_EditAmc.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                //((HomeActivityNew) getActivity()).editAMCDialog(mAmcDetails);
                serviceOccurrenceTask();
            }
        });
    }

    private void FGALoadEvent() {
        //NOTE: Log GA event
        Bundle bundle = new Bundle();
        bundle.putInt(FirebaseGoogleAnalytics.Param.USER_ID, SharedPrefManager.getInstance(getContext()).getUserId());
        bundle.putString(FirebaseGoogleAnalytics.Param.VERSION_NAME, BuildConfig.VERSION_NAME);
        bundle.putString(FirebaseGoogleAnalytics.Param.USER_TYPE, SharedPrefManager.getInstance(getContext()).getUserGroup());
        bundle.putString(FirebaseGoogleAnalytics.Param.TIME_STAMP, DateUtils.getDateForWithGAFormat());
        bundle.putString(FirebaseGoogleAnalytics.Param.PLATFORM, FirebaseGoogleAnalytics.Defaults.PLATFORM_ANDROID);
        bundle.putInt(FirebaseGoogleAnalytics.Param.AMC_ID, mAMCsId);
        FirebaseAnalytics.getInstance(getContext()).logEvent(FirebaseGoogleAnalytics.Event.AMC_DETAILS, bundle);
    }

    public void getAMCDetailsTask(int amcId, int mAMCServiceDetailsId) {
        /*mGetAMCReportDetailsAsyncTask = new GetAMCReportDetailsAsyncTask(getActivity(), BaseAsyncTask.Priority.LOW, this);
        mGetAMCReportDetailsAsyncTask.execute(SharedPrefManager.getInstance(getActivity()).getUserId(), amcId, mAMCServiceDetailsId);*/
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                Call<AMCDetails> call = RetrofitClient.getInstance(getContext()).getMyApi().getAMCDetails(SharedPrefManager.getInstance(getActivity()).getUserId(), amcId, mAMCServiceDetailsId);
                call.enqueue(new retrofit2.Callback<AMCDetails>() {
                    @Override
                    public void onResponse(Call<AMCDetails> call, Response<AMCDetails> response) {
                        try {
                            if (response.code() == 200) {
                                FWLogger.logInfo(TAG, "AMC Details");
                                mAmcDetails = response.body();
                                if (mAmcDetails.getCode().equalsIgnoreCase("200") && mAmcDetails.getMessage().equalsIgnoreCase("Success Request")) {
                                    setResultData(mAmcDetails);
                                }
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<AMCDetails> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in AMCReportDetails API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in AMCReportDetails API:");
            ex.getMessage();
        }
    }

    public void serviceOccurrenceTask() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                Call<ServiceOccurrenceList> call = RetrofitClient.getInstance(getActivity()).getMyApi().getServiceOccurrenceTask();
                call.enqueue(new retrofit2.Callback<ServiceOccurrenceList>() {
                    @Override
                    public void onResponse(Call<ServiceOccurrenceList> call, Response<ServiceOccurrenceList> response) {
                        try {
                            if (response.code() == 200) {
                                ServiceOccurrenceList serviceOccurrenceList = response.body();
                                FWLogger.logInfo(TAG, "Service Occurrence List Received Successfully");
                                mServiceOccurrenceResultList = new ArrayList<>();
                                mServiceOccurrenceResultList = serviceOccurrenceList.getResultData();
                               /* mServiceOccurrenceTypeList = new ArrayList<>();
                                for (ServiceOccurrenceList.ResultData resultData : mServiceOccurrenceResultList) {
                                    mServiceOccurrenceTypeList.add(resultData.getServiceOccuranceType());
                                }*/
                                reminderModeTask();

                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<ServiceOccurrenceList> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAMCServiceOccuranceType API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAMCServiceOccuranceType API:");
            ex.getMessage();
        }
    }

    public void reminderModeTask() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                Call<ReminderModeList> call = RetrofitClient.getInstance(getActivity()).getMyApi().getReminderModeTask();
                call.enqueue(new retrofit2.Callback<ReminderModeList>() {
                    @Override
                    public void onResponse(Call<ReminderModeList> call, Response<ReminderModeList> response) {
                        try {
                            if (response.code() == 200) {
                                ReminderModeList reminderModeList = response.body();
                                FWLogger.logInfo(TAG, "Reminder Mode List Received Successfully");
                                // mReminderModeList = new ArrayList<>();
                                mReminderModeResultList = reminderModeList.getResultData();
                              /*  for (ReminderModeList.ResultData resultData : mReminderModeResultList) {
                                    mReminderModeList.add(resultData.getAMCSetReminderType());
                                }*/
                                // editAMCDialog(mServiceOccurrenceResultList, mReminderModeResultList, mAmcDetails, getContext());
                                getAMCDetailsForEdit(mAMCsId);
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<ReminderModeList> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAMCSetReminders API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAMCSetReminders API:");
            ex.getMessage();
        }

    }

    public void editAMCDialog(List<ServiceOccurrenceList.ResultData> mServiceOccurrenceResultList, List<ReminderModeList.ResultData> mReminderModeResultList, EditAMCDTO amcDetails, Context mContext) {
        AMCDialog amcDialog = AMCDialog.getInstance();
        amcDialog.editAMC(getActivity(), mServiceOccurrenceResultList, mReminderModeResultList, -1, -1, -1, amcDetails, mContext);
    }

    public void getAMCDetailsForEdit(int amcId) {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                int userID = SharedPrefManager.getInstance(getActivity()).getUserId();
                Call<EditAMCDTO> call = RetrofitClient.getInstance(getContext()).getMyApi().getAMCDetailsForEdit(userID, amcId, "Bearer " + SharedPrefManager.getInstance(getActivity()).getUserToken());
                call.enqueue(new retrofit2.Callback<EditAMCDTO>() {
                    @Override
                    public void onResponse(Call<EditAMCDTO> call, Response<EditAMCDTO> response) {
                        try {
                            if (response.code() == 200) {
                                FWLogger.logInfo(TAG, "AMC Details");
                                editAMCDTO = response.body();
                                if (mAmcDetails.getCode().equalsIgnoreCase("200") && mAmcDetails.getMessage().equalsIgnoreCase("Success Request")) {
                                    //setResultData(mAmcDetails);
                                    editAMCDialog(mServiceOccurrenceResultList, mReminderModeResultList, editAMCDTO/*mAmcDetails*/, getContext());
                                }

                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<EditAMCDTO> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAMCDetails API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAMCDetails API:");
            ex.getMessage();
        }
    }


    @Override
    public void onTaskComplete(URLConnectionResponse urlConnectionResponse, String classType) {
        if (classType.equalsIgnoreCase(AMCDetails.class.getSimpleName())) {
            FWLogger.logInfo(TAG, "AMC Details");
            Gson gson = new Gson();
            mAmcDetails = gson.fromJson(urlConnectionResponse.resultData, AMCDetails.class);
            if (mAmcDetails.getCode().equalsIgnoreCase("200") && mAmcDetails.getMessage().equalsIgnoreCase("Success Request")) {
                setResultData(mAmcDetails);
            }
        } else if (classType.equalsIgnoreCase(DownloadReport.class.getSimpleName())) {
            Gson gson = new Gson();
            DownloadReport downloadReport = gson.fromJson(urlConnectionResponse.resultData, DownloadReport.class);
            if (downloadReport != null) {
                FWLogger.logInfo(TAG, "Code : " + downloadReport.getCode());
                FWLogger.logInfo(TAG, "Message : " + downloadReport.getMessage());
                if (downloadReport.getCode().equalsIgnoreCase("200")) {
                    if (!hasPermissions(getContext(), PERMISSIONS)) {
                        Log.v(TAG, "download() Method DON'T HAVE PERMISSIONS ");
                        Toast t = Toast.makeText(getContext(), R.string.you_dont_have_write_access, Toast.LENGTH_LONG);
                        t.show();
                    } else {
                        DownloadFile.downloadFile(downloadReport.getMessage(), getActivity());
                    }
                } else {
                    Toast.makeText(getContext(), downloadReport.getMessage(), Toast.LENGTH_LONG).show();
                }
            }
        }
    }

    private void setResultData(AMCDetails amcDetails) {
        AMCDetails.ResultData AMCResultData = amcDetails.getResultData();
        if (AMCResultData.getAMCName() != null)
            mTextViewAMCName.setText(AMCResultData.getAMCName());

      /*  if (AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber() != null)
            mTextViewCustomerNumber.setText(AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber());
*/
        if (AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber() != null) {
            String countryCode = SharedPrefManager.getInstance(getContext()).getCountryCode();
            mTextViewCustomerNumber.setText("+" + countryCode + " " + AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber());
        }
        if (AMCResultData.getProductDetail().getCustomerDetailInfoDto().getCustomerName() != null)
            mTextViewCustomerName.setText(AMCResultData.getProductDetail().getCustomerDetailInfoDto().getCustomerName());
        if (AMCResultData.getProductDetail().getCustomerLocationInfoDto().getAddress() != null)
            mTextViewCustomerAddress.setText(AMCResultData.getProductDetail().getCustomerLocationInfoDto().getAddress());
        if (AMCResultData.getProductDetail().getCustomerLocationInfoDto().getDescription() != null)
            mTextViewCustomerLandmark.setText(AMCResultData.getProductDetail().getCustomerLocationInfoDto().getDescription());
        if (AMCResultData.getProductDetail().getProductBrand() != null)
            mTextViewProductBrand.setText(AMCResultData.getProductDetail().getProductBrand());
        if (AMCResultData.getProductDetail().getProductSerialNo() != null)
            mTextViewSerialNumber.setText(AMCResultData.getProductDetail().getProductSerialNo());
        if (AMCResultData.getProductDetail().getUnderWarranty() == true)
            mTextViewUnderWarranty.setText("Yes");
        else mTextViewUnderWarranty.setText("No");

       /* if (AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber() != null && !AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber().isEmpty())
            mTextViewAMCContactNo.setText("" + AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber());
*/
        if (AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber() != null && !AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber().isEmpty()) {
            String countryCode = SharedPrefManager.getInstance(getContext()).getCountryCode();
            mTextViewAMCContactNo.setText("+" + countryCode + " " + AMCResultData.getProductDetail().getCustomerDetailInfoDto().getMobileNumber());
        }
        if (AMCResultData.getProductDetail().getCustomerDetailInfoDto().getEmailId() != null && !AMCResultData.getProductDetail().getCustomerDetailInfoDto().getEmailId().isEmpty())
            mTextViewCustomerEmail.setText("" + AMCResultData.getProductDetail().getCustomerDetailInfoDto().getEmailId());

        if (AMCResultData.getActivationDate() != null) {
            String[] activationDate = AMCResultData.getActivationDate().split("T");
            String date = DateUtils.convertDateFormat(activationDate[0], "yyyy-MM-dd", "dd-MM-yyyy");
            mTextViewActivationDate.setText(date);  //+ " T " + AMCResultData.getActivationTime() + " Z"
        }
        // AMC CONTRACT DATE / EXPIRY DATE
        try {
            if (AMCResultData.getContractDate() != null) {
                String[] contractDate = AMCResultData.getContractDate().split("T");
                String date = DateUtils.convertDateFormat(contractDate[0], "yyyy-MM-dd", "dd-MM-yyyy");
                mTextViewContractDate.setText(date);  //+ " T " + AMCResultData.getActivationTime() + " Z"
            }
        } catch (Exception ex) {
            ex.getMessage();
        }
        try {
            if (AMCResultData.getExpiryDate() != null) {
                String[] expiryDate = AMCResultData.getExpiryDate().split("T");
                String date = DateUtils.convertDateFormat(expiryDate[0], "yyyy-MM-dd", "dd-MM-yyyy");
                mTextViewExpiryDate.setText(date);  //+ " T " + AMCResultData.getActivationTime() + " Z"
            } else {
                String[] lastAMCServiceDate = AMCResultData.getLastAMCServiceDate().split("T");
                String date = DateUtils.convertDateFormat(lastAMCServiceDate[0], "yyyy-MM-dd", "dd-MM-yyyy");
                mTextViewExpiryDate.setText(date);
            }
        } catch (Exception ex) {
            ex.getMessage();
        }

        if (AMCResultData.isActive() == true) {
            mTextViewStatus.setText("Active");
            mTextViewStatus.setTextColor(getResources().getColor(R.color.green));
            mTextViewAMCStatus.setText("Active");
            mTextViewAMCStatus.setTextColor(getResources().getColor(R.color.green));
        } else {
            mTextViewStatus.setText("DeActive");
            mTextViewStatus.setTextColor(getResources().getColor(R.color.dark_gray));
            mTextViewAMCStatus.setText("DeActive");
            mTextViewAMCStatus.setTextColor(getResources().getColor(R.color.dark_gray));
        }
        String countrySymbol = SharedPrefManager.getInstance(getContext()).getCountrySymbol();

        ////////Dynamic Currency Symbol////////

        if (AMCResultData.getAMCAmount() != 0) {

            if (countrySymbol.equals("Rs")) {
                mTextViewAmount.setText("₹" + " " + AMCResultData.getAMCAmount());
            } else {
                mTextViewAmount.setText(countrySymbol + " " + AMCResultData.getAMCAmount());
            }
        } else {
            mTextViewAmount.setText("NA");
        }

        ///////////////////////////////

        ////////Dynamic Currency Symbol////////

        /*  if (AMCResultData.getReceivedAmt() != 0) {*/ // older condition
        if (AMCResultData.getAMCAmount() != 0) {
            try {
                Double remainingAmt = AMCResultData.getAMCAmount() - AMCResultData.getReceivedAmt();
                int remintAmt = remainingAmt.intValue();
                if (countrySymbol.equals("Rs")) {
                    mTextViewRemainingAmt.setText("₹" + " " + remintAmt);
                } else {
                    mTextViewRemainingAmt.setText(countrySymbol + " " + remintAmt);
                }
            } catch (Exception ex) {
                ex.getMessage();
            }
        } else {
            mTextViewRemainingAmt.setText("NA");
        }

        ///////////////////////////////


        if (AMCResultData.getTotalServices() != 0)
            mTextViewNumberOfServices.setText("" + AMCResultData.getTotalServices());

        mTextViewServicesCompleted.setText("" + mServicesDone);

        if (AMCResultData.getProductDetail().getProductName() != null)
            mTextViewProductName.setText(AMCResultData.getProductDetail().getProductName());

        if (AMCResultData.getProductDetail().getProductName() != null)
            mTextViewProductName.setText(AMCResultData.getProductDetail().getProductName());

        if (AMCResultData.getAMCSetReminderType() != null)
            mTextViewReminder.setText(AMCResultData.getAMCSetReminderType());

        if (AMCResultData.getAMCNotes() != null && !AMCResultData.getAMCNotes().isEmpty())
            mTextViewAMCNote.setText(AMCResultData.getAMCNotes());
        else mTextViewAMCNote.setText(getActivity().getResources().getString(R.string.na));

        if (AMCResultData.getServiceOccuranceType() != null)
            mTextViewServiceOccurrence.setText(AMCResultData.getServiceOccuranceType());
        if (AMCResultData.getTaskDetails() != null && AMCResultData.getTaskDetails().size() > 0) {
            setTaskDetails(AMCResultData.getTaskDetails());
            mTextViewServiceDetails.setText(getResources().getString(R.string.services_details));
        } else {
            mTextViewServiceDetails.setText(getResources().getString(R.string.services_details) + " : NA");
        }
    }

    private void setTaskDetails(List<AMCDetails.TaskDetails> taskDetailsList) {
        mLayoutManager = new LinearLayoutManager(getActivity());
        mRecyclerViewServiceList.setLayoutManager(mLayoutManager);
        for (AMCDetails.TaskDetails taskDetails : taskDetailsList) {
            if (taskDetails.getTaskStatus() == 1) {
                mServicesDone++;
            }
        }
        FWLogger.logInfo("mServicesDone : ", "" + mServicesDone);
        mTextViewServicesCompleted.setText("" + mServicesDone);
        mServiceListAdapter = new ServiceListAdapter(taskDetailsList, getContext()); //, this
        mRecyclerViewServiceList.setAdapter(mServiceListAdapter);
    }

    private static boolean hasPermissions(Context context, String... permissions) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && context != null && permissions != null) {
            for (String permission : permissions) {
                if (ActivityCompat.checkSelfPermission(context, permission) != PackageManager.PERMISSION_GRANTED) {
                    return false;
                }
            }
        }
        return true;
    }

    private void getDownloadReport(int amcId) {
        if (amcId != 0) {
            try {
                if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                    Call<DownloadReport> call = RetrofitClient.getInstance(getContext()).getMyApi().getDownloadAMCReport(amcId, SharedPrefManager.getInstance(getContext()).getUserId());
                    call.enqueue(new retrofit2.Callback<DownloadReport>() {
                        @Override
                        public void onResponse(Call<DownloadReport> call, Response<DownloadReport> response) {
                            try {
                                if (response.code() == 200) {
                                    DownloadReport downloadReport = response.body();
                                    if (downloadReport != null) {
                                        FWLogger.logInfo(TAG, "Code : " + downloadReport.getCode());
                                        FWLogger.logInfo(TAG, "Message : " + downloadReport.getMessage());
                                        if (downloadReport.getCode().equalsIgnoreCase("200")) {
                                            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                                                // Android 8 & 9 only need permission
                                                if (!hasPermissions(getContext(), PERMISSIONS)) {

                                                    requestPermissions(PERMISSIONS, PERMISSION_REQUEST_CODE);

                                                    return;
                                                }
                                            }

                                            // Android 10–16 → No storage permission needed
                                            DownloadFile.downloadFile(downloadReport.getMessage(), getActivity());

                                            /*if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                                if (!hasPermissions(getContext(), PERMISSIONS_TIRAMISU)) {
                                                    Log.v(TAG, "download() Method DON'T HAVE PERMISSIONS ");
                                                    Toast t = Toast.makeText(getContext(), R.string.you_dont_have_write_access, Toast.LENGTH_LONG);
                                                    t.show();
                                                } else {
                                                    DownloadFile.downloadFile(downloadReport.getMessage(), getActivity());
                                                }
                                            } else if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
                                                if (!hasPermissions(getContext(), PERMISSIONS)) {
                                                    Log.v(TAG, "download() Method DON'T HAVE PERMISSIONS ");
                                                    Toast t = Toast.makeText(getContext(), R.string.you_dont_have_write_access, Toast.LENGTH_LONG);
                                                    t.show();
                                                } else {
                                                    DownloadFile.downloadFile(downloadReport.getMessage(), getActivity());
                                                }
                                            }*/
                                          /*  if (!hasPermissions(getContext(), PERMISSIONS)) {
                                                Log.v(TAG, "download() Method DON'T HAVE PERMISSIONS ");
                                                Toast t = Toast.makeText(getContext(), R.string.you_dont_have_write_access, Toast.LENGTH_LONG);
                                                t.show();
                                            } else {
                                                DownloadFile.downloadFile(downloadReport.getMessage(), getActivity());
                                            }*/
                                        } else {
                                            Toast.makeText(getContext(), downloadReport.getMessage(), Toast.LENGTH_LONG).show();
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                e.getMessage();
                            }
                        }

                        @Override
                        public void onFailure(Call<DownloadReport> call, Throwable throwable) {
                            FWLogger.logInfo(TAG, "Exception in AMCReportPDF? API:");
                        }
                    });
                } else {
                    ServiceDialog serviceDialog = ServiceDialog.getInstance();
                    serviceDialog.noConnectionDialogRetro(getActivity());
                }
            } catch (Exception ex) {
                FWLogger.logInfo(TAG, "Exception in AMCReportPDF? API:");
                ex.getMessage();
            }
        }
    }

    private void deleteAMC(List<DeleteAMC.ResultData> deleteAMC) {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                Call<DeleteAMC> call = RetrofitClient.getInstance(getContext()).getMyApi().deleteAMC(deleteAMC, "Bearer " + SharedPrefManager.getInstance(getContext()).getUserToken());
                call.enqueue(new retrofit2.Callback<DeleteAMC>() {
                    @Override
                    public void onResponse(Call<DeleteAMC> call, Response<DeleteAMC> response) {
                        try {
                            if (response.code() == 200) {
                                DeleteAMC deleteAMC = response.body();
                                if (deleteAMC.getCode().equalsIgnoreCase("200")) {
                                    Toast.makeText(getContext(), deleteAMC.getMessage(), Toast.LENGTH_SHORT).show();
                                    AMCListFragment myFragment = new AMCListFragment();
                                    getActivity().getSupportFragmentManager().beginTransaction().add(R.id.home_fragment_container, myFragment).addToBackStack(null).commit();
                                } else {
                                    Toast.makeText(getContext(), deleteAMC.getMessage(), Toast.LENGTH_SHORT).show();
                                }
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                          /*try {
                            if (response.code() == 200) {
                                DeleteAMC deleteAMC = response.body();
                                if (deleteAMC.getCode().equalsIgnoreCase("200")) {
                                    Toast.makeText(getContext(), deleteAMC.getMessage(), Toast.LENGTH_SHORT).show();
                                }
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }*/
                    }

                    @Override
                    public void onFailure(Call<DeleteAMC> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in DeleteAMC API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in DeleteAMC API:");
            ex.getMessage();
        }
    }

    public void deleteAMCDialog(Activity activity) {
        FWDialog dialog = new FWDialog(activity, R.style.DialogSlideAnim);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.delete_amc_dialog);
        dialog.getWindow().setGravity(Gravity.BOTTOM);

        Button deleteLead, buttonCancel;

        deleteLead = dialog.findViewById(R.id.deleteLead);
        buttonCancel = dialog.findViewById(R.id.button_cancel);

        deleteLead.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mAMCsId != 0) {
                    List<DeleteAMC.ResultData> deleteAMCs = new ArrayList<DeleteAMC.ResultData>();
                    DeleteAMC.ResultData resultData = new DeleteAMC.ResultData();
                    resultData.setId(mAMCsId);
                    resultData.setUserId(SharedPrefManager.getInstance(getContext()).getUserId());
                    deleteAMCs.add(resultData);
                    deleteAMC(deleteAMCs);
                    dialog.dismiss();
                }
            }
        });

        buttonCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
            }
        });

        dialog.show();
    }
    /*private void downloadFile(String path) {
        try {
            final ProgressDialog pd = new ProgressDialog(getContext());
            pd.setProgressStyle(ProgressDialog.STYLE_SPINNER);
            pd.setMessage(getString(R.string.please_wait));
            pd.setIndeterminate(true);
            pd.setCancelable(false);
            pd.show();

            File storageDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        boolean downloadResponse = HttpDownloadUtility.downloadFile(path, storageDir.getAbsolutePath());
                        if(downloadResponse) {
                            if(getActivity() != null) {
                                getActivity().runOnUiThread(new Runnable() {
                                    public void run() {
                                        Toast.makeText(getActivity(), R.string.file_download_successfully, Toast.LENGTH_SHORT).show();
                                    }
                                });
                            }
                            String filename = path.substring(path.lastIndexOf("/")+1);
                            File file = new File(storageDir, filename);
                            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".provider", file);
                            // Open file with user selected app
                            Intent intent = new Intent();
                            intent.setAction(Intent.ACTION_VIEW);
                            intent.setDataAndType(uri, "application/pdf");
                            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            startActivity(intent);
                        } else {
                            getActivity().runOnUiThread(new Runnable() {
                                public void run() {
                                    Toast.makeText(getActivity(), R.string.sownload_failed, Toast.LENGTH_SHORT).show();
                                }
                            });
                        }
                        pd.dismiss();
                    } catch (IOException ex) {
                        pd.dismiss();
                        ex.printStackTrace();
                    }
                }
            }).start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }*/

    @Override
    public void onDestroyView() {
        super.onDestroyView();

        HomeActivityNew activity = (HomeActivityNew) getActivity();
        if (activity != null) {
            activity.mSpinnerAMCType.setVisibility(View.GONE);
            activity.mTextViewSpace.setVisibility(View.GONE);
            activity.mSpinnerAMCMonthYear.setVisibility(View.GONE);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        HomeActivityNew activity = (HomeActivityNew) getActivity();
        if (activity != null) {
            // Hide or visible these when fragment is visible
            if (activity.mRelativeHeaderLayout != null)
                activity.mRelativeHeaderLayout.setVisibility(View.GONE);

            if (activity.mSpinnerAMCType != null) activity.mSpinnerAMCType.setVisibility(View.GONE);

            if (activity.mTextViewSpace != null) activity.mTextViewSpace.setVisibility(View.GONE);

            if (activity.mSpinnerAMCMonthYear != null)
                activity.mSpinnerAMCMonthYear.setVisibility(View.GONE);

        }
    }
}