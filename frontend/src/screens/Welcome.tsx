import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "src/components/Container";
import { Button } from "src/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "src/components/ui/dialog";
import { useInfo } from "src/hooks/useInfo";

export function Welcome() {
  const { data: info } = useInfo();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!info?.setupCompleted) {
      return;
    }
    navigate("/");
  }, [info, navigate]);

  return (
    <Container>
      <div className="grid text-center gap-5">
        <div className="grid gap-2">
          <h1 className="font-semibold text-2xl font-headline">
            Welcome to Alby Hub
          </h1>
          <p className="text-muted-foreground">
            A powerful, all-in-one lightning wallet with a superpower of
            connecting into applications.
          </p>
        </div>
        <div className="grid gap-2">
          <Link to="/setup/password" className="w-full">
            <Button className="w-full">Create New Alby Hub</Button>
          </Link>
          {!info?.backendType && (
            <Link to="/setup/password?wallet=import" className="w-full">
              <Button variant="ghost" className="w-full">
                Import Existing Wallet
              </Button>
            </Link>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          By continuing, you agree to our <br />
          <Dialog>
            <DialogTrigger asChild>
              <a className="underline cursor-pointer">
                Terms of Service
              </a>
            </DialogTrigger>
            <DialogContent className={"lg:max-w-screen-lg overflow-y-scroll max-h-[90%]"}>
              <DialogHeader>
                <DialogTitle>Terms of Service</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 text-sm">
                <h2 className="font-semibold">Introduction</h2>
                <p>
                  These terms of service constitute a legally binding agreement (Agreement) made between you, whether personally or on behalf of an entity (“you” or “User(s)”) and Alby Inc., (“Alby”, “we”, “us”, or “our”), concerning your access to and use of our (“Services”) which include the Alby Account, the Alby Pro plan, the Alby Hub app, the Alby cloud infrastructure service.
                </p>
                <p>
                  The Alby Account Pro plan allows users to self-host the Alby Hub app or connect another wallet to their Alby Account.
                </p>
                <p>
                  To facilitate the usage of the Alby Hub app, Alby is offering a cloud infrastructure service to give you the option to conveniently self-host the Alby Hub app. Alternatively you can install and run the Alby Hub app on any other device according to its technical requirements and connect it to your Alby Account if you registered for the Pro plan.
                </p>
                <h2 className="font-semibold">General</h2>
                <p>
                  By accepting these terms and accessing or using the Alby Pro plan, you agree that you have read, understood, and accepted all of the terms and conditions contained in this Agreement that apply to our Services, as well as our Privacy Policy.</p>
                <p>
                  You affirm that you are the older of 18 years old or the age of majority as required by your local law and have the capacity to enter into this Agreement. If you are accessing the Services on behalf of the company you work for, you also affirm you have the proper grant of authority and capacity to enter into this Agreement on behalf of such company.
                </p>
                <p>
                  We may change the terms of this agreement and supplemental agreement at any time without prior notice. Any changes will take effect immediately when posted (unless specifically indicated otherwise), and your continued use of the Services means you have accepted these changes.
                </p>
                <h2 className="font-semibold">User Representation</h2>
                <p>
                  By registering for the Alby Pro plan, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with this agreement; (4) you are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the account; (5) you will not use the account for any illegal or unauthorized purpose; and (6) your use of the account will not violate any applicable law or regulation.
                </p>
                <p>
                  If you breach any of the foregoing representations or warranties, we have the right to suspend or terminate your Alby Pro plan and refuse any and all current or future use of the Services (or any portion thereof).
                </p>
                <h2 className="font-semibold">Accessing Alby Pro plan</h2>
                <p>
                  We reserve the right to remove, reclaim, or change a username (e.g. your lightning address) you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                </p>
                <h2 className="font-semibold">
                  Responsibility
                </h2>
                <p>
                  You are fully responsible for how you use the Services.
                </p>
                <p>
                  It is your responsibility to keep a backup of all credentials, including the unlock password, the recovery phrase, private keys and other sensitive information related to the Alby Account and the Alby Hub app and to keep this backup outside of Services. If you do not maintain a backup of your Alby Hub app outside of Services, you will not be able to access the bitcoin previously accessed using your Alby Hub app.
                </p>
                <p>
                  You are responsible for the use of Services by any user who accesses Services with your account credentials.
                </p>
                <p>
                  You are responsible for obtaining all necessary rights and permissions to permit processing of Content in the Alby infrastructure service.
                </p>
                <h2 className="font-semibold">
                  Password Management
                </h2>
                <p>
                  With respect to the Alby Hub app, Alby does not receive or store the unlock password, nor any recovery phrase or private keys, or the individual transaction history. Alby cannot assist you with password retrieval. You are solely responsible for remembering, storing and keeping secret the password and recovery phrase. The assets you have associated with the Alby Hub app may become inaccessible if you do not know or keep secret your password, private keys and recovery phrase. Any third party with knowledge of one or more of your credentials (including, without limitation, a recovery phrase or password) can access the assets via your Alby Hub app or recover your funds in another app and initiate transactions.
                </p>
                <p>
                  When you use the Alby Hub app using the Alby cloud infrastructure service, we strongly recommend that you: (i) create a strong password that you do not use for any other website or online service; (ii) provide accurate and truthful information; (iii) protect and keep secret all credentials such as the recovery phrase; (iii) protect access to your device, Alby Account and Alby Hub app; (iv) promptly notify us if you discover or otherwise suspect any security breaches related to the Alby Hub app; and (v) create a backup of the recovery phrase and passcode. You agree to take responsibility for all activities that occur with your Alby Hub app and accept all risks of any authorized or unauthorized access to their app, to the maximum extent permitted by law.
                </p>
                <h2 className="font-semibold">
                  Transactions
                </h2>
                <p>
                  Alby shall not be liable to you for any malformed transaction payloads created using our Services.
                </p>
                <p>
                  Once transaction details have been submitted to the bitcoin lightning network, we cannot assist you in canceling or otherwise modifying the transaction or transaction details. Alby has no control over your assets stored by the Alby Hub app and does not have the ability to facilitate any cancellation or modification requests.
                </p>
                <h2 className="font-semibold">Alby's cloud infrastructure service</h2>
                <p>
                  In combination with the Alby Pro plan, we are offering a cloud infrastructure service to give you the opportunity to self-host your Alby Hub app.
                  There are no service level commitments, however, Alby uses its best effort to maintain high service levels and minimize downtimes.
                  It is agreed between Alby and the user that during an incident the objective of us will be to expeditiously resolve the incident and make reasonable assessment of the severity and call for certain elevated incident response.
                  Any planned maintenance and downtime of the Alby infrastructure service will be announced upfront. There might be emergency changes that leave no time for notifications to you.
                  Service interruptions may happen due to unrecoverable underlying infrastructure failure from hardware providers or any components, services, connections that are outside Alby’s control.
                  Examples:
                </p>
                <ul className="list-disc list-inside">
                  <li>Any Force Majeure incidents that impact the accessibility of cloud infrastructure locations of Alby.</li>
                  <li>Any performance and service level deviations due to targeted attacks on the platform by anyone or due to the breach of fair or projected usage patterns by users.</li>
                  <li>Distributed Denial of Service attack originating from any server.</li>
                  <li>Sudden burst of requests not in line with the previously known traffic patterns.
                    Support hours and response times:</li>
                  <li>Email support: you'll receive an email response within 24 hours (Monday–Friday).</li>
                  <li>Live chat and phone support: Live chat and phone support are available during our local business hours upon request (9:00am–5:00pm, Monday–Friday).</li>
                </ul>
                <h2 className="font-semibold">Ownership and control</h2>
                <p>
                  You retain all ownership and intellectual property rights in and to your Content (as defined below). The use of the Alby infrastructure service will not affect your ownership or license rights in Content.
                  Content consists of all data, software such as the Alby Hub app, and information that you authorize access to, input to or run through the Alby cloud infrastructure service.
                  We retain all ownership and intellectual property rights in the Alby Account service and the cloud infrastructure service, derivative works thereof, and anything developed or delivered by or on behalf of us under this Agreement.
                  This means you retain full ownership of the Alby Hub app when you self-host the app with the Alby cloud infrastructure service.
                  Alby has no control over the data that a user provides to form any transaction using the Alby Hub app; or how transactions are processed in the bitcoin lightning network.
                  Alby therefore cannot and does not ensure that any transaction details you submit via the Alby Hub app will be confirmed on the bitcoin and lightning network. The transaction details submitted by you via applications provided by us may not be completed, or may be substantially delayed, by the bitcoin lightning network used to process the transaction. We do not guarantee that the Alby Hub app can transfer title or right in bitcoin or make any warranties whatsoever with regard to title.
                </p>
                <h2 className="font-semibold">Fees</h2>
                <p>
                  Alby charges a fixed monthly fee for the Alby Pro plan. You agree to pay any fees charged in connection with the Alby Pro plan. Alby reserves the right to change the fees at our discretion.
                  Alby will disclose the amount of fees we will charge for the Pro plan at the time that you sign up or via other electronic channels (e.g. email).
                  The user may incur charges from third parties by using the Alby Hub app.
                  One example are network fees required to use the bitcoin and lightning network applicable to a bitcoin and lightning transaction. Alby may attempt to calculate such a fee for you. Our calculation may not be sufficient, or it may be excessive. You are solely responsible for selecting and paying any such fee and Alby shall not advance or fund such a fee on the user’s behalf. Alby shall not be responsible for any excess or insufficient fee calculation.
                </p>
                <h2 className="font-semibold">Termination and suspension</h2>
                <p>
                  You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term.
                  If Alby terminates or suspends a user’s account for any reason, the user is prohibited from registering and creating a new account under their name, a fake or borrowed name, or the name of any third party, even if the user may be acting on behalf of the third party. In addition to terminating or suspending the account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.
                </p>
                <h2 className="font-semibold">Acceptable Use</h2>
                <p>
                  The user agrees not to use Services in ways that:
                  <ul className="list-disc list-inside">
                    <li>violate, misappropriate, or infringe the rights of any Alby entity, our users, or others, including privacy, publicity, intellectual property, or other proprietary rights;</li>
                    <li>are illegal, defamatory, threatening, intimidating, or harassing;</li>
                    <li>involve impersonating someone;</li>
                    <li>breach any duty toward or rights of any person or entity, including rights of publicity, privacy, or trademark;</li>
                    <li>involve sending illegal or impermissible communications such as bulk messaging, auto-messaging, auto-dialing, and the like;</li>
                    <li>avoid, bypass, remove, deactivate, impair, descramble or otherwise circumvent any technological measure implemented by us or any of our service providers or any other third party (including another user) to protect Services;</li>
                    <li>interfere with, or attempt to interfere with, the access of any user, host or network, including, without limitation, sending a virus, overloading, flooding, spamming, or mail-bombing;</li>
                    <li>violate any applicable law or regulation; or</li>
                    <li>encourage or enable any other individual to do any of the foregoing.</li>
                  </ul>
                </p>
                <h2 className="font-semibold">User Comments, Feedback, and Other Submissions</h2>
                <p>
                  If, at our request, you send certain specific submissions or without a request from us you send creative ideas, suggestions, proposals, plans, or other materials, whether online, by email, by postal mail, or otherwise (collectively, "comments"), you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us. We are and shall be under no obligation (1) to maintain any comments in confidence; (2) to pay compensation for any comments; or (3) to respond to any comments. We may, but have no obligation to, monitor, edit or remove content that we determine in our sole discretion are unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene or otherwise objectionable or violates any party's intellectual property or this Agreement. You agree that your comments will not violate any right of any third-party, including copyright, trademark, privacy, personality or other personal or proprietary right. You further agree that your comments will not contain libelous or otherwise unlawful, abusive or obscene material, or contain any computer virus or other malware that could in any way affect the operation of Service or any related website. You may not use a false email address, pretend to be someone other than yourself, or otherwise mislead us or third-parties as to the origin of any comments. You are solely responsible for any comments you make and their accuracy. We take no responsibility and assume no liability for any comments posted by you or any third-party.
                </p>
                <h2 className="font-semibold">Personal Information</h2>
                <p>
                  Your submission of personal information through the Service is governed by our Privacy Policy at https://getalby.com/privacy-policy.
                </p>

                <h2 className="font-semibold">Errors, Inaccuracies, and Omissions</h2>
                <p>
                  Occasionally there may be information in our Services that contains typographical errors, inaccuracies or omissions that may relate to product or service descriptions, pricing, and/or promotions. We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel purchases if any information in our Services is inaccurate at any time without prior notice (including after you have submitted your purchase). We undertake no obligation to update, amend or clarify information in our Services, including without limitation, pricing information, except as required by law. No specified update or refresh date should be taken to indicate that all information in our Services has been modified or updated.
                </p>
                <h2 className="font-semibold">Warranties</h2>
                <p>
                  OUR SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF SERVICES’ CONTENT OR THE CONTENT OF ANY WEBSITES LINKED TO SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND ANY AND ALL PERSONAL INFORMATION OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA SERVICES. WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. ALBY MAKES NO GUARANTEE THAT YOUR USE OF SERVICES WILL COMPLY WITH ANY APPLICABLE LAW OR REGULATION.
                </p>
                <h2 className="font-semibold">Limitations of Liability</h2>
                <p>
                  Alby Inc. shall not be liable to you or anyone else for any loss or injury resulting directly or indirectly from your use of Services, including any loss caused in whole or part by any inaccuracies or incompleteness, delays, interruptions, errors or omissions, including, but not limited to, those arising from the negligence of Alby Inc. or contingencies beyond its control in procuring, compiling, interpreting, computing, reporting, or delivering Services. In no event will Alby inc. be liable to you or anyone else for any decision made or action taken by you in reliance on, or in connection with your use of Services or the information therein.
                  IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING. CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
                  We are not responsible for loss of assets due to customer error. These include, but are not limited to, loss of recovery phrase, loss of credentials, or configuring the same Alby Hub app outside of Services. Furthermore, we are not responsible for loss of funds due to system outages. It is up to you to ensure proper backups and monitoring of your Alby Hub app with us. We may elect to provide services that assist you with monitoring and backups from time to time, but such services are not intended to shift responsibility for monitoring and backups from you to us.

                  Indemnification
                  You agree to indemnify and hold harmless Alby and its affiliates, officers, directors, employees and agents, from and against any claims, disputes, demands, liabilities, damages, losses, and costs and expenses, including, without limitation, reasonable legal and accounting fees arising out of or in any way connected with (i) their access to Alby Pro Account, the Alby Hub app or the Alby cloud infrastructure service, (ii) Third Party Services, or (ii) your violation of this Agreement.

                  Governing Law and Jurisdiction
                  This Agreement shall be governed by and construed in accordance with the laws of Switzerland under the exclusion of its conflict of law provisions and the International Convention on the Sale of Goods (CISG). The ordinary courts of Zug, Switzerland, shall have sole jurisdiction relating to any dispute arising out of or in connection with this Agreement. YOU AND WE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY ON AN INDIVIDUAL BASIS, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. YOU AND WE EXPRESSLY WAIVE ANY RIGHT TO FILE A CLASS ACTION OR SEEK RELIEF ON A CLASS BASIS.
                </p>
                <h2 className="font-semibold">Dispute Resolution</h2>
                <p>
                  Any dispute, controversy, or claim arising out of, or in relation to, this contract, including regarding the validity, invalidity, breach, or termination thereof, shall be resolved by arbitration in accordance with the Swiss Rules of International Arbitration of the Swiss Arbitration Centre in force on the date on which the Notice of Arbitration is submitted in accordance with those Rules.
                  The number of arbitrators shall be one;
                  The seat of the arbitration shall be Zug;
                  The arbitral proceedings shall be conducted in English.
                </p>
                <h2 className="font-semibold">Changes to the Agreement</h2>
                <p>You can review the most current version of this Agreement at any time at this page. We reserve the right, at our sole discretion, to update, change or replace any part of this Agreement to the website or via email. It is your responsibility to check our website and emails periodically for changes. Your continued use of or access to Services following the posting of any changes to this Agreement constitutes acceptance of those changes.</p>

                <h2 className="font-semibold">Termination</h2>
                <p>
                  The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all purposes. This Agreement is effective unless and until terminated by either you or us. You may terminate this agreement at any time when you cease using Services. If in our sole judgment you fail, or we suspect that you have failed, to comply with any term or provision of this agreement, we also may terminate this agreement at any time without notice and you will remain liable for all amounts due up to and including the date of termination; and/or accordingly may deny you access to the Alby Pro plan (or any part thereof).
                </p>

                <h2 className="font-semibold">Miscellaneous</h2>
                <p>
                  This agreement and any policies or operating rules posted by us on getalby.com websites constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of this agreement will not operate as a waiver of such right or provision. This agreement operates to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We will not be responsible or liable for any loss, damage, delay, or failure to act as a result of any act or event which occurs and is beyond our reasonable control, including, without limitation, acts of God, war, unrest or riot, strikes, any action of a governmental entity, weather, quarantine, fire, flood, earthquake, explosion, utility or telecommunications outages, Internet disturbance, epidemic, pandemic or any unforeseen change in circumstances, or any other causes beyond our reasonable control. If any provision or part of a provision of this agreement is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from this agreement and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of this agreement or use of Services.
                  You agree that this agreement will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of this agreement and the lack of signing by the parties hereto to execute this agreement.
                </p>
                <h2 className="font-semibold">Contact information</h2>
                <p>Questions about the Agreement should be sent to us at hello@getalby.com.</p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>{" "}
          and{" "}
          <Dialog>
            <DialogTrigger asChild>
              <a className="underline cursor-pointer">
                Privacy Policy
              </a>
            </DialogTrigger>
            <DialogContent className={"lg:max-w-screen-lg overflow-y-scroll max-h-[90%]"}>
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  getalby.com (hereinafter "Alby" or "We" or "Us") welcomes you to our internet page and services (together also referred to as "Online Offers"). We thank you for your interest in our company and our products.
                </p>
                <h2 className="font-semibold">1. Alby respects your privacy</h2>
                <p>
                  The protection of your privacy throughout the course of processing personal data as well as the security of all business data are important concerns to us. We process personal data that was gathered during your visit of our Online Offers confidentially and only in accordance with statutory regulations.
                  Data protection and information security are included in our corporate policy.
                </p>
                <h2 className="font-semibold">2. Controller</h2>
                <p>
                  Alby is the controller responsible for the processing of your data; exceptions are outlined in this data protection notice.
                  Our contact details are as follows: Alby Inc. 8 The Green STE A, Dover, DE 19901, United States. Contact email: hello@getalby.com
                </p>

                <h2 className="font-semibold">3. Collection, processing and usage of personal data</h2>
                <p>
                  Communication data, transaction data, lightning node authentication data are processed
                </p>
                <p>
                  3.1 Processed categories of data
                  Communication data, transaction data, lightning node authentication data are processed
                </p>
                <p>
                  3.2 Principles
                  Personal data consists of all information related to an identified or identifiable natural person, this includes, e.g. names, addresses, phone numbers, email addresses, contractual master data, contract accounting and payment data, which is an expression of a person's identity. We collect, process and use personal data (including IP addresses) only when there is either a statutory legal basis to do so or if you have given your consent to the processing or use of personal data concerning this matter, e.g. by means of registration.
                </p>
                <p>
                  3.3. Processing purposes and legal basis
                  We as well as the service providers commissioned by us; process your personal data for the following processing purposes:
                </p>
                <p>
                  3.3.1 Provision of these Online Offers
                  Legal basis: Legitimate interest as long as this occurs in accordance with data protection and competition law. Fulfillment of contractual obligations according to the Terms of Service
                </p>
                <p>
                  3.3.2 Resolving service disruptions as well as for security reasons.
                  Legal basis: Fulfillment of our legal obligations within the scope of data security and legitimate interest in resolving service disruptions as well as in the protection of our offers.
                </p>
                <p>
                  3.3.3 Self-promotion and promotion by others as well as market research and reach analysis done within the scope statutorily permitted or based on consent.
                  Legal basis: Consent or legitimate interest on our part in direct marketing if in accordance with data protection and competition law.
                </p>
                <p>
                  3.3.4 Product or customer surveys performed via email and/or telephone subject to your prior express consent.
                  Legal basis: Consent.
                </p>
                <p>
                  3.3.5 Sending an email or SMS/MMS newsletter subject to the recipient's consent
                  Legal basis: Consent.
                </p>
                <p>
                  3.3.6 Safeguarding and defending our rights.
                  Legal basis: Legitimate interest on our part for safeguarding and defending our rights.
                </p>
                <p>
                  3.4 Registration
                  If you wish to use or get access to benefits requiring to enter into the fulfillment of a contract, we re-quest your registration. With your registration we collect personal data necessary for entering into the fulfillment of the contract (e.g. email address) as well as further data, if applicable.
                </p>
                <p>
                  3.5 Log files
                  Each time you use the internet, your browser is transmitting certain information which we store in so-called log files. We store log files to determine service disruptions and for security reasons (e.g., to investigate attack attempts) for a period of 60 days and delete them afterwards. Log files which need to be maintained for evidence purposes are excluded from deletion until the respective incident is resolved and may, on a case-by-case basis, be passed on to investigating authorities. Log files are also used for analysis purposes (without the IP address or without the complete IP address) see module "Advertisements and/or market research (including web analysis, no customer surveys)". In log files, the following information is saved:
                </p>
                <ul className="list-disc list-inside">
                  <li>IP address (internet protocol address) of the terminal device used to access the Online Offer;</li>
                  <li>Internet address of the website from which the Online Offer is accessed (so-called URL of origin or referrer URL);</li>
                  <li>Name of the service provider which was used to access the Online Offer;</li>
                  <li>Name of the files or information accessed;</li>
                  <li>Date and time as well as duration of recalling the data;</li>
                  <li>Amount of data transferred;</li>
                  <li>Operating system and information on the internet browser used, including add-ons installed (e.g., Flash Player);</li>
                  <li>http status code (e.g., "Request successful" or "File requested not found").</li>
                </ul>
                <p>
                  3.6 Children
                  This Online Offer is not meant for children under 16 years of age.
                </p>
                <p>
                  3.7 Data transfer
                </p>
                <p>
                  3.7.1 Data transfer to other controllers
                  Principally, your personal data is forwarded to other controllers only if required for the fulfillment of a contractual obligation, or if we ourselves, or a third party, have a legitimate interest in the data transfer, or if you have given your consent. Particulars on the legal basis and the recipients or categories of recipients can be found in the Section - Processing purposes and legal basis. Additionally, data may be transferred to other controllers when we are obliged to do so due to statutory regulations or enforceable administrative or judicial orders.
                </p>
                <p>
                  3.7.2 Service providers (general)
                  We involve external service providers with tasks such as sales and marketing services, contract management, payment handling, programming, data hosting. We have chosen those service providers carefully and monitor them on a regular basis, especially regarding their diligent handling of and protection of the data that they store. All service providers are obliged to maintain confidentiality and to comply with the statutory provisions.
                </p>
                <p>
                  3.7.3 Transfer to recipients outside the EEA
                  We might transfer personal data to recipients located outside the EEA into so-called third countries. In such cases, prior to the transfer we ensure that either the data recipient provides an appropriate level of data protection or that you have consented to the transfer. You are entitled to receive an overview of third country recipients and a copy of the specifically agreed-provisions securing an appropriate level of data protection. For this purpose, please use the statements made in the Contact section.
                </p>
                <p>
                  3.8 Duration of storage, retention periods
                  Principally, we store your data for as long as it is necessary to render our Online Offers and connected services or for as long as we have a legitimate interest in storing the data. In all other cases we delete your personal data with the exception of data we are obliged to store for the fulfillment of legal obligations (e.g. due to retention periods under the tax and commercial codes we are obliged to have documents such as contracts and invoices available for a certain period of time).
                </p>

                <h2 className="font-semibold"> 4. Usage of Cookies</h2>
                <p>
                  In the context of our online service, cookies and tracking mechanisms may be used. Cookies are small text files that may be stored on your device when visiting our online service. Tracking is possible using different technologies. In particular, we process information using pixel technology and/or during log file analysis.
                </p>
                <p>
                  4.1 Categories
                  We distinguish between cookies that are mandatorily required for the technical functions of the online service and such cookies and tracking mechanisms that are not mandatorily required for the technical function of the online service.
                  It is generally possible to use the online service without any cookies that serve non-technical purposes.
                </p>
                <p>
                  4.1.1 Technically required cookies
                  By technically required cookies we mean cookies without those the technical provision of the online service cannot be ensured.
                  Such cookies will be deleted when you leave the website.
                </p>
                <p>
                  4.1.2 Cookies and tracking mechanisms that are technically not required
                  We only use cookies and tracking mechanisms if you have given us your prior consent in each case. With the exception of the cookie that saves the current status of your privacy settings (selection cookie). This cookie is set based on legitimate interest.
                  We distinguish between two sub-categories with regard to these cookies and tracking mechanisms:
                </p>
                <p>
                  4.1.3 Comfort cookies
                  These cookies facilitate operation and thus allow you to browse our online service more comfortably; e.g. your language settings may be included in these cookies.
                </p>
                <p>
                  4.2 Management of cookies and tracking mechanisms
                  You can manage your cookie and tracking mechanism settings in the browser.
                  Note: The settings you have made refer only to the browser used in each case.
                </p>
                <p>
                  4.2.1 Deactivation of all cookies
                  If you wish to deactivate all cookies, please deactivate cookies in your browser settings. Please note that this may affect the functionality of the website.
                </p>
                <h2 className="font-semibold"> 5. Data processing by App Store operators</h2>
                <p>
                  We do not collect data, and it is beyond our responsibility, when data, such as username, email address and individual device identifier are transferred to an app store (e.g., Google Web Store, Firefox Add-ons) when downloading the respective application. We are unable to influence this data collection and further processing by the App Store as controller.
                </p>

                <h2 className="font-semibold">6. Communication tools on social media platforms</h2>
                <p>
                  We use on our social media platform (e.g. twitter) communication tools to process your messages sent via this social media platform and to offer you support.
                  When sending a message via our social media platform the message is processed to handle your query (and if necessary additional data, which we receive from the social media provider in connection with this message as your name or files).
                  In addition we can analyze these data in an aggregated and anonymized form in order to better understand how our social media platform is used.
                  The legal basis for the processing of your data is our legitimate interest (Art. 6 para. 1 s. 1 lit. f GDPR) or, if applicable, an existing contractual relationship (Art. 6 para. 1 s. 1 lit. b GDPR).
                </p>
                <h2 className="font-semibold">7. Newsletter with opt-in; Right of withdrawal</h2>
                <p>
                  Within the scope of our Online Offers you can sign up for newsletters. We provide the so-called double opt-in option which means that we will only send you a newsletter via email, mobile messenger (such as, e.g. WhatsApp), SMS or push notification after you have explicitly confirmed the activation of the newsletter service to us by clicking on the link in a notification. In case you wish to no longer receive newsletters, you can terminate the subscription at any time by withdrawing your consent. You can withdraw your consent to email newsletters by clicking on the link which is sent in the respective newsletter mail, or in the administrative settings of the online offer. Alternatively, please contact us via the contact details provided in the Contact section.
                </p>
                <h2 className="font-semibold">8. External links</h2>
                <p>
                  Our Online Offers may contain links to internet pages of third parties, in particular providers who are not related to us. Upon clicking on the link, we have no influence on the collecting, processing and use of personal data possibly transmitted by clicking on the link to the third party (such as the IP address or the URL of the site on which the link is located) as the conduct of third parties is naturally beyond our control. We do not assume responsibility for the processing of personal data by third parties.
                </p>
                <h2 className="font-semibold">9. Security</h2>
                <p>
                  Our employees and the companies providing services on our behalf, are obliged to confidentiality and to compliance with the applicable data protection laws.
                  We take all necessary technical and organizational measures to ensure an appropriate level of security and to protect your data that are administrated by us especially from the risks of unintended or unlawful destruction, manipulation, loss, change or unauthorized disclosure or unauthorized access. Our security measures are, pursuant to technological progress, constantly being improved.
                </p>
                <h2 className="font-semibold">10. User rights</h2>
                <p>
                  To enforce your rights, please use the details provided in the Contact section. In doing so, please ensure that an unambiguous identification of your person is possible.
                </p>
                <p>
                  10.1 Right to information and access
                  You have the right to obtain confirmation from us about whether or not your personal data is being processed, and, if this is the case, access to your personal data.
                </p>
                <p>
                  10.2 Right to correction and deletion
                  You have the right to obtain the rectification of inaccurate personal data. As far as statutory requirements are fulfilled, you have the right to obtain the completion or deletion of your data.
                  This does not apply to data which is necessary for billing or accounting purposes or which is subject to a statutory retention period. If access to such data is not required, however, its processing is restricted (see the following).
                </p>
                <p>
                  10.3 Restriction of processing
                  As far as statutory requirements are fulfilled you have the right to demand for restriction of the processing of your data.
                </p>
                <p>
                  10.4 Data portability
                  As far as statutory requirements are fulfilled you may request to receive data that you have provided to us in a structured, commonly used and machine-readable format or - if technically feasible - that we transfer those data to a third party.
                </p>
                <p>
                  10.5 Right of objection
                </p>
                <p>
                  10.5.1 Objection to direct marketing
                  Additionally, you may object to the processing of your personal data for direct marketing purposes at any time. Please take into account that due to organizational reasons, there might be an overlap between your objection and the usage of your data within the scope of a campaign which is already running.
                </p>
                <p>
                  10.5.2 Objection to data processing based on the legal basis of "legitimate interest"
                  In addition, you have the right to object to the processing of your personal data at any time, insofar as this is based on "legitimate interest". We will then terminate the processing of your data, unless we demonstrate compelling legitimate grounds according to legal requirements which override your rights.
                </p>
                <p>
                  10.6 Withdrawal of consent
                  In case you consented to the processing of your data, you have the right to revoke this consent at any time with effect for the future. The lawfulness of data processing prior to your withdrawal remains unchanged.
                </p>
                <p>
                  10.7 Right to lodge complaint with supervisory authority:
                  You have the right to lodge a complaint with a supervisory authority. You can appeal to the supervisory authority which is responsible for your place of residence or your state of residency.
                </p>

                <h2 className="font-semibold">11. Changes to the Data Protection Notice</h2>
                <p>
                  We reserve the right to change our security and data protection measures. In such cases, we will amend our data protection notice accordingly. Please, therefore, notice the current version of our data protection notice, as this is subject to changes.
                </p>
                <h2 className="font-semibold">12. Contact</h2>
                <p>
                  If you wish to contact us, please find us at the address stated in the "Controller" section.

                  Effective date: 2023.03.01
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </Container>
  );
}
