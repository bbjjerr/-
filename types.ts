export enum ScreenName {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DOCTOR_SEARCH = 'DOCTOR_SEARCH',
  DOCTOR_DETAIL = 'DOCTOR_DETAIL',
  BOOKING = 'BOOKING',
  APPOINTMENTS_LIST = 'APPOINTMENTS_LIST',
  APPOINTMENT_DETAIL = 'APPOINTMENT_DETAIL',
  CHAT = 'CHAT',
  CHAT_LIST = 'CHAT_LIST',
  PET_PROFILE = 'PET_PROFILE',
  USER_PROFILE = 'USER_PROFILE',
  ADMIN = 'ADMIN',
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  rating: number;
  image: string;
  tags: string[];
  price?: number;
  awards?: string[];
  satisfaction?: string;
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
  type: 'dog' | 'cat';
}

export const IMAGES = {
    goldenRetrieverHead: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJy3aFo2q3sFY9-FokYIQxQMsk68IsEu0S3AJ9lyR0d-IpVgalP4JlyLfZtFf_xwykUY-g-u7u-ao9BqCB5u7JwNW-9DSimXxq1a2g6g0Y5Hf6dD1mokM1TOfLsQkoz7i9eULOYhLh73bNHZo6t7i_EKry7xCLQsKfu5JFOKZEo-jr_ebEDpBBmF5dvBTTYULbLPgaHizPK0MGcuIZ25B7fxH6HOke6z6OBYoRvi3lnPxGzsskJnjwmUj5iObstcyQYg7s22kaej2P",
    goldenRetrieverRun: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0N3VIPLaVmRgaUmzJQe1x2SHhp0m_Oi-_PvC5Mb91QGRE2zh_sXdihEIybIRtKukjWc_11SVLfgqO9D_n78728nsQui5WIMCij-tIr3gnHYqu1cCIbPaHZdAcAO3QMYSzkQahQC9ZuHF2s9yLtiLl2d4wo2VuqC7oh-7Z_G1IgEAR5-sityxViLPfy7dfGACBXYP9EdSkqL7xKPqZbjzhMY--5_jnYxqyWKLSPsalxHHD0uMzeXpsh23gIme_jKFFGMK0ITp9XKLW",
    drSarah: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMg2whfzSLtjjSSW1c0itTI0XVRB8w_BjCZZSdeHmHOJ55FP3T6KXn8UoFbU039AeE1gUhAxsJGkyVwZ8MYW5_MALZnC4v_6lpT6vLXENFw4_J9e4MvqBZeHNO4BwedcfAnrDoh5re3sTx_KFuvltxUIBzJTREyn25mP5NnGhX27pBFFEv08h0b9fjIlz5CNHd1dWAFO2ffVMByNEG1HkAUjGOwWpYkoqEq2eZDM3ww_wrwDPBp_WGv3zBnxipOMfRR-aeJ4PaPUFt",
    drEmily: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAHr4cmrtH_ZjfxND1l_B5HFIuFpN1ejX9HynTOQpaGjAW9mF4eq-KoFPQqUN-wAN1QmZichoTo0jd-wBNPYSEYWb0eAde1a5vGxKyQAHvDuqfsH_yNaZjfxRqUdvzVKUHqIveLoMk_9bOBBYwz8WTxnPIdcX-GuPMwU8XVN_8XB-ueutXe3N4-9bbLAefCY_foicSQaaRUePt_MpIml54Nint7ThVn25cni821vm-II_5QI0wNMJxjO2QU2w1TJMMDF7qTdf3Py-6",
    drMichael: "https://lh3.googleusercontent.com/aida-public/AB6AXuAujkgNYkuItsULWm5dpdEPg6QJQmR1U0mr0xIeccY948LAf820WsktyvSKIyYDoqEkD1frtUaaM-qSVSwwTu68qKkL7rLivqG-Fo5e_ancTsgbe56baWudkYkLiQp8RZ04Ka-d88izG-afENxPQuS3eL-_kO9sXSbUSPUDa09iAJkUx-z7CDZ4L1Wq3XWjBxxPd8tfQiI3V5mauypGaP7u8uVD2XUylBo7t1_s87GeuF4vovlSwzXukfsGx_gWu3kXwvZcjkhFJ6N7",
    drAlex: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRYJ0W3QmOgnw2Hb13sHDXtaxXraxZxmxUi9zw9iS3D8hbc4c0WJV-QYVOXM-VfU2L5Wj-wU3auQFLR65d4s4osUXXFR-Gemgkj-neG8Tr3Z8rpVFbq9zzEwba8aN17GhH_zDK_LCqVmdiXOoMfd8v59_vuAjUpu6-9XZE7iAun5NtmL2E1dc2xGLb28efCdRRZjhPtdgfrpbDu5BQJGDb4yDWpm8JKe_xLiz_QwabceG7S2ReG7SFbWea1W-ZVF_-A7rOZJD-Dw2S",
    userSarah: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmb5kVFEdfIz70W0rC8CAJXxnMgR4-1koqDr3EcFAE5I-vfPVh0B4NHWAI3l-ieDciJsl_i0yotWLqse1-M5A92OwBuTG5ULSXHJij3kvZDC39P1k2xtcabfnv3WOnahAduEAxxT--SutPO_gJI4um4bPeS-Fq1BPhFcRgTZNuQk-eC7ryvYWB-DFhBFwxv8TxEAoaZWTk1WT9ZtUqZpQ-9omxv6G1Rzmu7Wsz3tvuMfDCZYHXLCbZfGF0Ho6gdRXXTDo4uQkNKRaD",
    petBuddy: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLszxRl1tS0icRufpGRQXGtQBgsXCUNn_h9Dgi3ZHKLGFDBcymbTSfmc7AB5qPcp7DYGA1EP2-kguDWoDNAYZl3bVf5v-JqEcHmjhUrJgij9loZXvzth43P76-Y_2PsV6Jy3Z442_mfRZOj9kL3a508Xc1PzvM4-az6rVjsultH2ylEpmP8g2-ZpPnA5d-ZaYGyyqjGhiKR1Yszqdr_92gH43HJPhxz4pE1G5fu4EM5wc8l3fQBXpM9QuCJ2k06StHw5K1Z-PqUbcA",
    petLuna: "https://lh3.googleusercontent.com/aida-public/AB6AXuDq5yYwIEsxzl21TOO4MvzXm5rUnhPRQHge9XvdTGqJansgHPKTyUmS2fq_9z9o3K3BTLaJ2jSk8TyqO0QAuFqaLspvREujUN6ri4kVG2qSMysCW752WtZtJ7NAqx3nQ1QJvT81xLhjWZFEmuDS9aytTJ7Jitojv-AWAi-EJqBVCQGG4ebX_UW6VT9RGIVwrqzc7A6OOR6v8f1whLTTxm57tv7MEqD2Qq3amKjZRNWcZLu7fRzW02dLcczlMZySNKA4yv2YxT0mRR7B",
    dentalChart: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHGg0VFG24hEL6RW6XbNq4sTUWcoqKlT0eLNxYmnsjFUKDUsWIS1qb16IEM7Txr46S3fp1uU24g3Y23BIk1kePRhdJnfpdAbDce1AHEW4FOrc37bpLDYwuklmhD_bXm3GbHkwPNcmJDANcLQ48RLTMX2UluAjoATZlqJG6EFrDlgG72zBhoIWocuSHLiWwfsEGI7bpJWATrWv1hWaX5E44XRalOOX9T7ebJK_s6Nw8qGQsRB1OLhiyQyGvlnSw_LGDC_h_e5nOAxw1",
    googleLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaoZtMdxJqmq0xX2IM1wUt_oKQcV7CeEKqcZqYmceQ3DC5MNrotnMZhWvtKDe4YtRKHMSFJhB2zFgSPVvtK7zDAERJ8s35uoTakQ8PYf7B69Svv365h1yULRz0ajkOk3RdX8VXj2SpdTbDqlq0tUu57sP2IWvI0S-suQ0xGmYfHaM0pKDa-4e61Wdgipby9mmi3TkwT_zbbVTuZ_FNad7QdMyvTJfVD6FkAbE1crG5sHh6JXuKrFieOgeuYaaoOw3NYNOELVStLRsv"
};