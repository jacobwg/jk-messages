class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable,
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me
  attr_accessible :provider, :uid, :name
  attr_accessible :token, :token_expiration

  attr_accessible :status, :icon

  def icon
    read_attribute(:icon) || 'ok'
  end

  def self.find_for_facebook_oauth(auth, signed_in_resource=nil)
    user = User.where(:provider => auth.provider, :uid => auth.uid).first
    if user
      user.token = auth.credentials.token
      user.save
    else
      user = User.create(name:auth.extra.raw_info.name,
                         provider:auth.provider,
                         uid:auth.uid,
                         email:auth.info.email,
                         password:Devise.friendly_token[0,20],
                         token: auth.credentials.token
                         )
    end
    user
  end

  def self.new_with_session(params, session)
    Rails.logger.info(session)
    super.tap do |user|
      if data = session["devise.facebook_data"]
        if session["devise.facebook_data"]["extra"]["raw_info"]
          user.email = data["email"] if user.email.blank?
        end
        if session['devise.facebook_data']["credentials"]
          user.token = session['devise.facebook_data']["credentials"]['token']
          user.token_expiration = Date.parse(session['devise.facebook_data']["credentials"]['expires_at'])
        end
      end
    end
  end

end
