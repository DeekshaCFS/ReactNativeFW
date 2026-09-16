package com.corefield.fieldweb.Adapter;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.RecyclerView;

import com.corefield.fieldweb.DTO.User.AddBulkTech;
import com.corefield.fieldweb.FieldWeb.Admin.AddBulkTechFragment;
import com.corefield.fieldweb.FieldWeb.Admin.EmployeeListFragment;
import com.corefield.fieldweb.FieldWeb.BaseActivity;
import com.corefield.fieldweb.FieldWeb.Home.OwnerDashboardFragment;
import com.corefield.fieldweb.FieldWeb.HomeActivityNew;
import com.corefield.fieldweb.FieldWeb.LoginTouchlessActivity;
import com.corefield.fieldweb.Listener.RecyclerTouchListener;
import com.corefield.fieldweb.R;
import com.corefield.fieldweb.Util.CommonFunction;
import com.corefield.fieldweb.Util.Constant;
import com.corefield.fieldweb.Util.FWLogger;
import com.corefield.fieldweb.Util.SharedPrefManager;
import com.corefield.fieldweb.Util.ViewUtils;
import com.google.android.material.textfield.TextInputLayout;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * //
 * Created by CFS on 5/19/2020.
 * Project Name : fieldweb
 * Package : com.corefield.fieldweb.Adapter
 * Version : 1.2.0
 * Copyright (c) 2020 CFS. All rights reserved.
 * Comment : This adapter is used to populate the Technician list in Add Bulk Technician
 * This adapter can add or remove item smoothly.
 * //
 **/
public class AddTechListAdapter extends RecyclerView.Adapter<AddTechListAdapter.ViewHolder> {

    protected final String TAG = AddTechListAdapter.class.getSimpleName();
    public List<AddBulkTech.ResultData> mTechLists;
    private LayoutInflater mInflater;
    private Context mContext;
    private RecyclerTouchListener mClickListener;
    private int mPosition;
    private AddBulkTechFragment mAddBulkTechFragment;
    private String mMessage = "";

    private Pattern mPattern;
    private Matcher mMatcher;
    private boolean mResult = false;
    private String mCheckCharPattern = "";
    private String mErrorMessage = "";
    private static String mFirstName = "", mLastName = "", mNumber = "";
    public static EditText mGlobalFirstName, mGlobalLastName, mGlobalNumber;

    /**
     * Constructor
     *
     * @param resultDataList      result data
     * @param context             context
     * @param addBulkTechFragment calling fragment
     */
    public AddTechListAdapter(List<AddBulkTech.ResultData> resultDataList, Context context, AddBulkTechFragment addBulkTechFragment, String message) {
        this.mInflater = LayoutInflater.from(context);
        this.mTechLists = resultDataList;
        this.mContext = context;
        this.mAddBulkTechFragment = addBulkTechFragment;
        this.mClickListener = addBulkTechFragment;
        this.mMessage = message;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int i) {
        View view = mInflater.inflate(R.layout.add_bulk_tech_row, viewGroup, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder viewHolder, int position) {
        AddBulkTech.ResultData techResult = mTechLists.get(position);
        if (techResult != null) {
            viewHolder.mEditTextFirstName.setText(techResult.getFirstName());
            viewHolder.mEditTextLastName.setText(techResult.getLastName());
            //viewHolder.mEditTextUserName.setText(techResult.getUserName());
            try {
                if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() == 1) {
                    viewHolder.txtMobileLayout.setVisibility(View.VISIBLE);
                    viewHolder.txtEmailLayout.setVisibility(View.GONE);
                    viewHolder.mEditTextPhoneNumber.setText(techResult.getContactNo());
                } else {
                    viewHolder.txtEmailLayout.setVisibility(View.VISIBLE);
                    viewHolder.txtMobileLayout.setVisibility(View.GONE);
                    viewHolder.meditTextEmailid.setText(techResult.getEmail());
                }
            } catch (Exception e) {
                e.getMessage();
            }


            if (this.mMessage != null && this.mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_failed, mContext))) {
                if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() == 1) {
                    if (techResult.getContactNo() != null && !techResult.getIsMobileNo()) {
                        viewHolder.mEditTextPhoneNumber.setError(mContext.getString(R.string.already_exist_or_incorrect));
                    }
                } else {
                    if (techResult.getEmail() != null && !techResult.equals(techResult.getEmail())) {
                        viewHolder.meditTextEmailid.setError(mContext.getString(R.string.already_exist_or_incorrect));
                    }
                }

                    /*else if (techResult.getUserName() != null && !techResult.getIsUserId()) {
                    viewHolder.mEditTextUserName.setError(mContext.getString(R.string.already_exist_or_incorrect));
                }*/
                if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() == 1) {
                    if (techResult.getContactNo() != null && !techResult.getContactNo().isEmpty()
                        /* && techResult.getUserName() != null && !techResult.getUserName().isEmpty()*/) {
                        if (!techResult.getIsMobileNo()) {
                            viewHolder.mEditTextPhoneNumber.setError(mContext.getString(R.string.already_exist_or_incorrect));
                        }
                       /*else if (!techResult.getIsUserId()) {
                        viewHolder.mEditTextUserName.setError(mContext.getString(R.string.already_exist_or_incorrect));
                    }*/
                    }
                } else {
                    if (techResult.getEmail() != null && !techResult.getEmail().isEmpty()) {
                        if (!techResult.equals(techResult.getEmail())) {
                            viewHolder.meditTextEmailid.setError(mContext.getString(R.string.already_exist_or_incorrect));
                        }/*else if (!techResult.getIsUserId()) {
                        viewHolder.mEditTextUserName.setError(mContext.getString(R.string.already_exist_or_incorrect));
                    }*/
                    }
                }

            } /*else if(this.mMessage != null && this.mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_successfully, mContext))) {
                if(viewHolder.mEditTextPhoneNumber.getError() != null)
                    viewHolder.mEditTextPhoneNumber.setError(null);

                if(viewHolder.mEditTextUserName.getError() != null)
                    viewHolder.mEditTextUserName.setError(null);
            }*/
        }


        if (position == mTechLists.size() - 1) {
            viewHolder.mTextViewAddMore.setVisibility(View.VISIBLE);
        } else {
            if (viewHolder.mTextViewAddMore.getVisibility() == View.VISIBLE) {
                viewHolder.mTextViewAddMore.setVisibility(View.GONE);
            }
        }
        viewHolder.mImageButtonCancelAddTech.setVisibility(View.VISIBLE);

        if (position == 0) {
            // viewHolder.mImageButtonCancelAddTech.setVisibility(View.GONE);
        }
        viewHolder.mTextViewTechnicianNo.setText(mContext.getString(R.string.fieldworker) + " #" + (position + 1));
    }

    @Override
    public int getItemCount() {
        return mTechLists.size();
    }

    @Override
    public long getItemId(int position) {
        return super.getItemId(position);
    }

    public class ViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {

        EditText mEditTextFirstName, mEditTextLastName, mEditTextPhoneNumber, meditTextEmailid/*, mEditTextUserName*/;
        TextView mTextViewTechnicianNo, mTextViewAddMore;
        ImageButton mImageButtonCancelAddTech;
        TextInputLayout txtMobileLayout, txtEmailLayout;
        ImageView mPhoneBook;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            setIsRecyclable(false);
            mEditTextFirstName = itemView.findViewById(R.id.editText_first_name);
            mGlobalFirstName = mEditTextFirstName;

            mEditTextLastName = itemView.findViewById(R.id.editText_last_name);
            mGlobalLastName = mEditTextLastName;

            mEditTextPhoneNumber = itemView.findViewById(R.id.editText_phone_number);
            mGlobalNumber = mEditTextPhoneNumber;

            mPhoneBook = itemView.findViewById(R.id.imageView_phonebook);
            meditTextEmailid = itemView.findViewById(R.id.editText_Emailid);
            //mEditTextUserName = itemView.findViewById(R.id.editText_username);
            mTextViewAddMore = itemView.findViewById(R.id.textView_add_more);
            mTextViewTechnicianNo = itemView.findViewById(R.id.textView_technician_no);
            mImageButtonCancelAddTech = itemView.findViewById(R.id.imageButton_cancel_add_tech);
            //
            txtMobileLayout = itemView.findViewById(R.id.txtMobileLayout);
            txtEmailLayout = itemView.findViewById(R.id.txtEmailLayout);

            mTextViewAddMore.setOnClickListener(this);
            mImageButtonCancelAddTech.setOnClickListener(this);
            mPhoneBook.setOnClickListener(this);

            mEditTextFirstName.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                }

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    try {
                        if (s.toString().contains("@")) {
                            mEditTextFirstName.setText("");
                        }
                    } catch (Exception e) {
                        e.getMessage();
                    }
                }

                @Override
                public void afterTextChanged(Editable s) {
                    mTechLists.get(getAdapterPosition()).setFirstName(s.toString());
                    /*if(mMessage != null && (mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_successfully, mContext)))) {
                        mAddBulkTechFragment.disableValidate();
                        mAddBulkTechFragment.enableSubmit();
                        mMessage = "";
                    } else {
                        mAddBulkTechFragment.enableValidate();
                        mAddBulkTechFragment.disableSubmit();
                    }*/
                    mAddBulkTechFragment.enableValidate();
                    //mAddBulkTechFragment.disableSubmit();
                }
            });

            mEditTextLastName.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                }

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    try {
                        if (s.toString().contains("@")) {
                            mEditTextFirstName.setText("");
                        }
                    } catch (Exception e) {
                        e.getMessage();
                    }
                }

                @Override
                public void afterTextChanged(Editable s) {
                    mTechLists.get(getAdapterPosition()).setLastName(s.toString());
                    /*if(mMessage != null && (mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_successfully, mContext)))) {
                        mAddBulkTechFragment.disableValidate();
                        mAddBulkTechFragment.enableSubmit();
                        mMessage = "";
                    } else {
                        mAddBulkTechFragment.enableValidate();
                        mAddBulkTechFragment.disableSubmit();
                    }*/
                    mAddBulkTechFragment.enableValidate();
                    //mAddBulkTechFragment.disableSubmit();
                }
            });

            // INDIAN -- Username blank
            // NRI --- Username = EMail

            mEditTextPhoneNumber.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                }

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                }

                @Override
                public void afterTextChanged(Editable s) {
                    mTechLists.get(getAdapterPosition()).setContactNo(s.toString());
                    mTechLists.get(getAdapterPosition()).setUserName("");
                    mTechLists.get(getAdapterPosition()).setUserCountryCode(SharedPrefManager.getInstance(mContext).getCountryDetailsID());
                    mTechLists.get(getAdapterPosition()).setCreatedBy(SharedPrefManager.getInstance(mContext).getUserId());
                    /*if(mMessage != null && (mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_successfully, mContext)))) {
                        mAddBulkTechFragment.disableValidate();
                        mAddBulkTechFragment.enableSubmit();
                        mMessage = "";
                    } else {
                        mAddBulkTechFragment.enableValidate();
                        mAddBulkTechFragment.disableSubmit();
                    }*/
                    mAddBulkTechFragment.enableValidate();
                    // mAddBulkTechFragment.disableSubmit();
                }
            });

            meditTextEmailid.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                }

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                }

                @Override
                public void afterTextChanged(Editable s) {
                    mTechLists.get(getAdapterPosition()).setEmail(s.toString());
                    mTechLists.get(getAdapterPosition()).setUserName(s.toString());
                    mTechLists.get(getAdapterPosition()).setUserCountryCode(SharedPrefManager.getInstance(mContext).getCountryDetailsID());
                    mTechLists.get(getAdapterPosition()).setCreatedBy(SharedPrefManager.getInstance(mContext).getUserId());

                    mAddBulkTechFragment.enableValidate();
                    // mAddBulkTechFragment.disableSubmit();
                }
            });


            /*mEditTextUserName.setOnFocusChangeListener(new View.OnFocusChangeListener() {
                @Override
                public void onFocusChange(View v, boolean hasFocus) {
                    mCheckCharPattern = "(?=.*^[a-zA-Z]).*$";
                    mPattern = Pattern.compile(mCheckCharPattern);
                    mMatcher = mPattern.matcher(mEditTextUserName.getText().toString());
                    mResult = mMatcher.matches();
                    if (!mResult) {
                        mErrorMessage = mContext.getString(R.string.first_char_of_username);
                    }
                }
            });*/

           /* mEditTextUserName.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                }

                @Override
                public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
                }

                @Override
                public void afterTextChanged(Editable s) {
                    mTechLists.get(getAdapterPosition()).setUserName(s.toString());
                    mTechLists.get(getAdapterPosition()).setCreatedBy(SharedPrefManager.getInstance(mContext).getUserId());
                    *//*if(mMessage != null && (mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_successfully, mContext)))) {
                        mAddBulkTechFragment.disableValidate();
                        mAddBulkTechFragment.enableSubmit();
                        mMessage = "";
                    } else {
                        mAddBulkTechFragment.enableValidate();
                        mAddBulkTechFragment.disableSubmit();
                    }*//*
                    mAddBulkTechFragment.enableValidate();
                    // mAddBulkTechFragment.disableSubmit();
                }
            });*/
        }

        @Override
        public void onClick(View v) {
            mClickListener.onClick(v, getAdapterPosition());
            /*  switch (v.getId()) {*/
            int id = v.getId();
            if (id == R.id.textView_add_more) {
                /* case R.id.textView_add_more:*/
                   /* mAddBulkTechFragment.enableValidate();
                    mAddBulkTechFragment.disableSubmit();
                    if (mTechLists.size() < 5) {
                        levelOneValidation();
                    } else {
                        Toast.makeText(mContext, mContext.getResources().getString(R.string.not_allowed), Toast.LENGTH_SHORT).show();
                        mAddBulkTechFragment.disableValidate();
                        mAddBulkTechFragment.enableSubmit();
                    }*/

                if (mTechLists.size() < 5) {
                    levelOneValidation();
                } else {
                    //Toast.makeText(mContext, mContext.getResources().getString(R.string.not_allowed), Toast.LENGTH_SHORT).show();
                    CommonFunction.showFailureMsg(mContext.getResources().getString(R.string.not_allowed), (Activity) mContext);
                    //mAddBulkTechFragment.disableValidate();
                    mAddBulkTechFragment.enableSubmit();
                }
                //break;
            } else if (id == R.id.imageButton_cancel_add_tech) {
                /* case R.id.imageButton_cancel_add_tech:*/
                //remove technician
                /* if (getAdapterPosition() == 1) {*/
                if (getAdapterPosition() >= 1) {
                    removeItem(getAdapterPosition());
                } else {
                       /* Intent intent = new Intent(mContext, HomeActivityNew.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        mContext.startActivity(intent);*/
                    CommonFunction.showFailureMsg(mContext.getResources().getString(R.string.not_allowed), (Activity) mContext);
                       /* AppCompatActivity activity = (AppCompatActivity) v.getContext();
                        EmployeeListFragment employeeListFragment = new EmployeeListFragment();
                        activity.getSupportFragmentManager().beginTransaction().replace(R.id.home_fragment_container, employeeListFragment).addToBackStack(null).commit();*/
                }

                //break;
            } else if (id == R.id.imageView_phonebook) {
                /* case R.id.imageView_phonebook:*/
                ((HomeActivityNew) mContext).getContactDetailsIntentAddTech();

                // break;
            }
        }

        public void levelOneValidation() {
            if (isEmpty(mEditTextFirstName)) {
                mEditTextFirstName.setError(mContext.getString(R.string.please_enter_first_name));
            } else if (isEmpty(mEditTextLastName)) {
                mEditTextLastName.setError(mContext.getString(R.string.please_enter_last_name));
            } else if (isContainsSpace(mEditTextFirstName)) {
                mEditTextFirstName.setError(mContext.getString(R.string.space_is_not_allowed));
            } else if (isContainsSpace(mEditTextLastName)) {
                mEditTextLastName.setError(mContext.getString(R.string.space_is_not_allowed));
            } else if (mEditTextFirstName.getText().toString().equalsIgnoreCase(mEditTextLastName.getText().toString())) {
                mEditTextLastName.setError(mContext.getString(R.string.use_different_names));
            }
            // 1 = FOR INDIA OR NRI VALIDATION
            else if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() == 1 && isEmpty(mEditTextPhoneNumber)) {
                mEditTextPhoneNumber.setError(mContext.getString(R.string.please_enter_phone_number));
            } else if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() == 1 && isValidPhone(mEditTextPhoneNumber)) {
                mEditTextPhoneNumber.setError(mContext.getString(R.string.please_enter_valid_no));
            } else if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() != 1 && isEmptyEmailId(meditTextEmailid)) {
                meditTextEmailid.setError(mContext.getString(R.string.enter_your_email_id));
            } else if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() != 1 && !isValidEmailId(meditTextEmailid)) {
                meditTextEmailid.setError(mContext.getString(R.string.please_enter_valid_emailid));
            } else if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() == 1 && levelTwoValidation(getAdapterPosition(), mEditTextPhoneNumber)) {
                addNewTech();
            } else if (SharedPrefManager.getInstance(mContext).getCountryDetailsID() != 1 && levelTwoEmailValidation(getAdapterPosition(), meditTextEmailid)) {
                addNewTech();
            }
        }


    }

    public boolean isValidateUserName(final String userName) {
        if (TextUtils.isEmpty(userName)) {
            mErrorMessage = mContext.getString(R.string.please_enter_userId);
        } else {
            mCheckCharPattern = "(?=.*^[a-zA-Z]).*$";
            mPattern = Pattern.compile(mCheckCharPattern);
            mMatcher = mPattern.matcher(userName);
            mResult = mMatcher.matches();
            if (!mResult) {
                mErrorMessage = mContext.getString(R.string.first_char_of_username);
            } else {
                mCheckCharPattern = "[a-zA-Z][a-zA-Z0-9&@#_]*$";
                mPattern = Pattern.compile(mCheckCharPattern);
                mMatcher = mPattern.matcher(userName);
                mResult = mMatcher.matches();
                if (!mResult) {
                    mErrorMessage = mContext.getString(R.string.username_should_contain_only);
                } else {
                    mCheckCharPattern = "^[a-zA-Z][a-zA-Z0-9&@#_]{5,14}$";
                    mPattern = Pattern.compile(mCheckCharPattern);
                    mMatcher = mPattern.matcher(userName);
                    mResult = mMatcher.matches();
                    if (!mResult) {
                        mErrorMessage = mContext.getString(R.string.username_must_be_of_more_than);
                    }
                }
            }
        }
        return mResult;
    }

    private void addNewTech() {
        ViewUtils.hideKeyboard((HomeActivityNew) mContext);
        AddBulkTech.ResultData resultData = new AddBulkTech.ResultData();
        resultData.setTempTechSrNo(mTechLists.size());
        resultData.setFirstName("");
        resultData.setLastName("");
        resultData.setContactNo("");
        resultData.setUserId(0);
        //To handle the set error in onBindViewHolder
        if (mMessage != null && mMessage.equalsIgnoreCase(BaseActivity.getLocaleStringResource(new Locale(Constant.PreferredLanguage.LOCALE_ENGLISH), R.string.validation_failed, mContext))) {
            mMessage = "";
        }
        restoreItem(resultData, mTechLists.size());
    }

    public AddBulkTech.ResultData getItem(int id) {
        return mTechLists.get(id);
    }

    public List<AddBulkTech.ResultData> getData() {
        return mTechLists;
    }

    public void setClickListener(RecyclerTouchListener itemClickListener) {
        this.mClickListener = itemClickListener;

    }

    private boolean isValidPhone(EditText text) {
        CharSequence phone = text.getText().toString();
        return phone.length() != 10;
    }

    private boolean isEmpty(EditText text) {
        CharSequence str = text.getText().toString();
        return TextUtils.isEmpty(str);
    }

    private boolean isContainsSpace(EditText text) {
        return text.getText().toString().contains(" ");
    }

    private boolean isEmptyEmailId(EditText text) {
        CharSequence str = text.getText().toString();
        return TextUtils.isEmpty(str);
    }

    private boolean isValidEmailId(EditText text) {
        boolean isValidEmail = true;
        if (!CommonFunction.isEmailValid(text.getText().toString())) {
            isValidEmail = false;
        }
        return isValidEmail;
    }


    private boolean levelTwoValidation(int position, EditText mEditTextPhoneNumber/*, EditText mEditTextUserName*/) {
        if (position > 0) {
            try {
                for (int i = 0; i < mTechLists.size() - 1; i++) {
                    if (mEditTextPhoneNumber.getText().toString().equalsIgnoreCase(mTechLists.get(i).getContactNo())) {
                        mEditTextPhoneNumber.setError(mContext.getString(R.string.please_use_different_phone_number));
                        return false;
                    } /*else if (mEditTextUserName.getText().toString().equalsIgnoreCase(mTechLists.get(i).getUserName())) {
                    mEditTextUserName.setError(mContext.getString(R.string.please_user_different_userId));
                    return false;
                }*/
                }
            } catch (Exception e) {
                e.getMessage();
            }

        } else return position == 0;
        return true;
    }

    private boolean levelTwoEmailValidation(int position, EditText meditTextEmailid) {
        if (position > 0) {
            try {
                for (int i = 0; i < mTechLists.size() - 1; i++) {
                    if (meditTextEmailid.getText().toString().equalsIgnoreCase(mTechLists.get(i).getEmail())) {
                        meditTextEmailid.setError(mContext.getString(R.string.please_use_different_emailid));
                        return false;
                    } /*else if (mEditTextUserName.getText().toString().equalsIgnoreCase(mTechLists.get(i).getUserName())) {
                    mEditTextUserName.setError(mContext.getString(R.string.please_user_different_userId));
                    return false;
                }*/
                }
            } catch (Exception e) {
                e.getMessage();
            }
        } else return position == 0;
        return true;
    }

    public void removeItem(int position) {
        mTechLists.get(position).setFirstName(null);
        mTechLists.get(position).setLastName(null);
        mTechLists.get(position).setContactNo(null);
        mTechLists.get(position).setUserId(0);
        mTechLists.get(position).setUserName(null);
        mTechLists.remove(position);
        for (int i = position - 1; i > 0; i--) {
            mTechLists.get(i).setTempTechSrNo(mTechLists.get(i).getTempTechSrNo() - 1);
        }
        notifyItemRemoved(position);
        notifyDataSetChanged();
    }

    public void restoreItem(AddBulkTech.ResultData techList, int position) {
        mTechLists.add(position, techList);
        notifyItemInserted(position);
        notifyDataSetChanged();
    }

    public static void getContactData(String strFirstName, String strLastName, String strNumber) {
        mFirstName = strFirstName;
        mLastName = strLastName;
        mNumber = strNumber;
        mGlobalFirstName.setText(mFirstName);
        mGlobalLastName.setText(mLastName);
        mGlobalNumber.setText(mNumber);
    }
}
