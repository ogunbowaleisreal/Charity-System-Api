// zeeh.types.ts

// IKycProvider.ts

export interface IKycProvider {
    verifyBVN(bvn: string): Promise<any>;
    verifyFace(imageBase64: string, bvn: string): Promise<any>;
    verifyCAC(rcNumber: string): Promise<any>;
    verifyUtilityBill(documentBase64: string): Promise<any>;
}
// 🔹 Base API Response
export interface ZeehApiResponse<T> {
    status: string; // "success" | "failed"
    message?: string;
    data: T;
    success: boolean;
}

// 🔹 BVN
export interface ZeehBvnRequest {
    bvn: string;
}

export interface ZeehBvnResponseData {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    phoneNumber: string;
}

export type ZeehBvnResponse = ZeehApiResponse<ZeehBvnResponseData>;

// 🔹 Face Verification
export interface ZeehFaceRequest {
    image: string; // base64
}

// export interface ZeehFaceResponseData {
//     match: boolean;
//     confidence: number;
//     livenessPassed: boolean;
// }

export interface ZeehFaceResponseData {
    success: boolean;
    statusCode: number;
    message: string;
    response_code: string;
    data: ZeehFaceBvnData;
}

export interface ZeehFaceBvnData {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;

    phoneNumber1: string;
    phoneNumber2?: string;

    residentialAddress: string;

    gender: string;
    email: string | null;

    levelOfAccount: string;

    lgaOfOrigin: string;
    lgaOfResidence: string;

    maritalStatus: string;
    nationality: string;

    stateOfOrigin: string;
    stateOfResidence: string;

    nin: string | null;

    base64Image: string;

    registrationDate: string;
    enrollmentBranch: string;
    title: string;

    bvn: string;
    nameOnCard: string;
    enrollmentBank: string;
    watchListed: string;

    number: string;

    face_data: ZeehFaceMatchData;
}

export interface ZeehFaceMatchData {
    status: boolean;
    response_code: string;
    message: string;

    confidence: number;
}

export type ZeehFaceResponse = ZeehFaceResponseData;

// 🔹 CAC
export interface ZeehCacRequest {
    rc_number: string;
}

export interface ZeehCacResponseData {
    companyName: string;
    status: string;
    directors: string[];
}

export type ZeehCacResponse = ZeehApiResponse<ZeehCacResponseData>;

// 🔹 Utility Bill
export interface ZeehUtilityBillRequest {
    document: string;
    type: "utility_bill";
}

export interface ZeehUtilityBillResponseData {
    isValid: boolean;
    extractedName?: string;
    extractedAddress?: string;
}

export type ZeehUtilityBillResponse =
    ZeehApiResponse<ZeehUtilityBillResponseData>;

// 🔹 Webhook Payload
export interface ZeehWebhookPayload {
    event: string;
    data: any;
    reference?: string;
}