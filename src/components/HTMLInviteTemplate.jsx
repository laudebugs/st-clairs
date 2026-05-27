import { forwardRef } from 'react';
import './HTMLInviteTemplate.css';

const HTMLInviteTemplate = forwardRef(({ name, settings }, ref) => {
  return (
    <div className="invite-wrapper">
      <div className="invite-border-rainbow" ref={ref}>
        <div className="invite-border-black-thin">
          <div className="invite-border-white">
            <div className="invite-border-filmstrip">
              <div className="invite-border-white">
                <div className="invite-border-black-thin">
                  <div className="invite-border-red">
                    <div className="invite-content-area">
                      
                      <div className="text-header">
                        THE BOM, STEERING COMMITTEE, PARENTS AND<br />
                        TEACHERS OF ST. CLARE'S SENIOR SCHOOL
                      </div>
                      
                      <div className="text-humbly">
                        Humbly Invites
                      </div>

                      <div className="dynamic-name" style={{
                        fontSize: `${settings.fontSize}px`,
                        color: settings.color,
                        fontFamily: settings.fontFamily || '"Playfair Display", serif',
                        fontStyle: 'italic',
                        fontWeight: '600'
                      }}>
                        {name || 'Guest Name'}
                      </div>
                      
                      <hr className="blue-divider" />

                      <div className="text-body-main">
                        To the School Fundraising for the Completion of the Computer Lab and<br />
                        Library to be held on <strong>Saturday, 13th June 2026</strong> in the school compound.
                      </div>

                      <div className="text-body-blue">
                        The funds drive will start with the Holy Mass at 10.00 am presided over by;
                      </div>

                      <div className="text-body-red-cursive">
                        RT. REV. PETER KIMANI NDUNG'U - BISHOP OF THE CATHOLIC DIOCESE OF EMBU.
                      </div>

                      <div className="text-body-green-cursive">
                        Your prayers, Presence and Generous contribution will be highly appreciated.
                      </div>

                      <div className="text-rsvp">
                        <u>R.S.V.P</u>
                      </div>

                      <div className="footer-blocks">
                        <div className="footer-left">
                          CHAIRMAN BOM<br />
                          STEPHEN GITONGA NGARI<br />
                          MOB: 0723 560 763
                        </div>
                        <div className="footer-right">
                          SECRETARY/BOM<br />
                          ANSELIA NJIRU<br />
                          MOB: 0720 852 355
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

HTMLInviteTemplate.displayName = 'HTMLInviteTemplate';

export default HTMLInviteTemplate;
